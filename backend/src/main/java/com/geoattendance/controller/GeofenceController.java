package com.geoattendance.controller;

import com.geoattendance.entity.Geofence;
import com.geoattendance.entity.User;
import com.geoattendance.service.GeofencingService;
import com.geoattendance.service.AuthenticationService;
import com.geoattendance.service.TeamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/geofences")
public class GeofenceController {

    private static final Logger log = LoggerFactory.getLogger(GeofenceController.class);

    private final GeofencingService geofencingService;
    private final AuthenticationService authenticationService;
    private final TeamService teamService;

    public GeofenceController(GeofencingService geofencingService, 
                            AuthenticationService authenticationService,
                            TeamService teamService) {
        this.geofencingService = geofencingService;
        this.authenticationService = authenticationService;
        this.teamService = teamService;
    }

    /**
     * Get all geofences (including inactive ones for management purposes)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<Geofence>> getAllGeofences() {
        User currentUser = authenticationService.getCurrentUser();
        List<Geofence> geofences;
        
        if ("ADMIN".equalsIgnoreCase(currentUser.getRole()) || "MANAGER".equalsIgnoreCase(currentUser.getRole())) {
            geofences = geofencingService.getGeofencesByManager(currentUser.getId());
        } else if ("EMPLOYEE".equalsIgnoreCase(currentUser.getRole())) {
            if (currentUser.getManagerId() != null) {
                geofences = geofencingService.getActiveGeofencesByManager(currentUser.getManagerId());
            } else {
                geofences = List.of();
            }
        } else {
            geofences = List.of();
        }
        
        return ResponseEntity.ok(geofences);
    }

    /**
     * Get geofence by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Geofence> getGeofence(@PathVariable String id) {
        Geofence geofence = geofencingService.getGeofenceById(id);
        return ResponseEntity.ok(geofence);
    }

    /**
     * Create a new geofence (Manager/Admin only)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Geofence> createGeofence(@RequestBody Geofence geofence) {
        User currentUser = authenticationService.getCurrentUser();
        geofence.setCreatedById(currentUser.getId());
        Geofence created = geofencingService.createGeofence(geofence);

        // If the creator is a manager, associate this geofence with their team
        if ("MANAGER".equalsIgnoreCase(currentUser.getRole())) {
            try {
                List<com.geoattendance.entity.Team> teams = teamService.getTeamsByManager(currentUser.getId());
                if (!teams.isEmpty()) {
                    com.geoattendance.entity.Team team = teams.get(0);
                    teamService.setGeofenceForTeam(team.getId(), created.getId());
                    log.info("Associated geofence {} with team {}", created.getId(), team.getId());
                }
            } catch (Exception e) {
                log.warn("Could not associate geofence with team: {}", e.getMessage());
                // Don't fail the request if team association fails
            }
        }
        return ResponseEntity.ok(created);
    }

    /**
     * Update a geofence
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Geofence> updateGeofence(
        @PathVariable String id,
        @RequestBody Geofence geofenceUpdate
    ) {
        User currentUser = authenticationService.getCurrentUser();
        Geofence existing = geofencingService.getGeofenceById(id);
        
        if (!currentUser.getId().equals(existing.getCreatedById()) && !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        Geofence updated = geofencingService.updateGeofence(id, geofenceUpdate);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Void> deleteGeofence(@PathVariable String id) {
        User currentUser = authenticationService.getCurrentUser();
        Geofence existing = geofencingService.getGeofenceById(id);
        
        if (!currentUser.getId().equals(existing.getCreatedById()) && !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(403).build();
        }
        
        geofencingService.deleteGeofence(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Check if a point is inside a geofence
     */
    @GetMapping("/{id}/check")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Boolean> checkPointInGeofence(
        @PathVariable String id,
        @RequestParam Double latitude,
        @RequestParam Double longitude
    ) {
        Geofence geofence = geofencingService.getGeofenceById(id);
        boolean inside = false;
        if (geofence.getGeofenceType() == Geofence.GeofenceType.CIRCLE) {
            inside = geofencingService.isPointInCircleGeofence(latitude, longitude, geofence);
        } else if (geofence.getGeofenceType() == Geofence.GeofenceType.POLYGON) {
            inside = geofencingService.isPointInPolygonGeofence(latitude, longitude, geofence);
        }
        return ResponseEntity.ok(inside);
    }

    /**
     * Find geofence containing a point
     */
    @GetMapping("/find")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Geofence> findGeofenceContainingPoint(
        @RequestParam Double latitude,
        @RequestParam Double longitude
    ) {
        User currentUser = authenticationService.getCurrentUser();
        String managerId = null;
        
        if ("MANAGER".equalsIgnoreCase(currentUser.getRole()) || "ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            managerId = currentUser.getId();
        } else if ("EMPLOYEE".equalsIgnoreCase(currentUser.getRole())) {
            managerId = currentUser.getManagerId();
        }
        
        if (managerId == null) {
            return ResponseEntity.ok(null);
        }
        
        List<Geofence> myActiveGeofences = geofencingService.getActiveGeofencesByManager(managerId);
        Geofence found = null;
        for (Geofence g : myActiveGeofences) {
            boolean inside = g.getGeofenceType() == Geofence.GeofenceType.CIRCLE
                ? geofencingService.isPointInCircleGeofence(latitude, longitude, g)
                : geofencingService.isPointInPolygonGeofence(latitude, longitude, g);
            if (inside) {
                found = g;
                break;
            }
        }
        
        return ResponseEntity.ok(found);
    }

    /**
     * Calculate distance between two points
     */
    @GetMapping("/distance")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Double> calculateDistance(
        @RequestParam Double lat1,
        @RequestParam Double lng1,
        @RequestParam Double lat2,
        @RequestParam Double lng2
    ) {
        double distance = geofencingService.calculateDistance(lat1, lng1, lat2, lng2);
        return ResponseEntity.ok(distance);
    }
}
