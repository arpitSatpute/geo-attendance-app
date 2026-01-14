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
        List<Geofence> geofences = geofencingService.getAllGeofences();
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
        Geofence updated = geofencingService.updateGeofence(id, geofenceUpdate);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a geofence
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Void> deleteGeofence(@PathVariable String id) {
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
        Geofence geofence = geofencingService.findGeofenceContainingPoint(latitude, longitude);
        return ResponseEntity.ok(geofence);
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
