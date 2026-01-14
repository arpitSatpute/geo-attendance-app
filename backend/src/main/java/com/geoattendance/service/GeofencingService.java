package com.geoattendance.service;

import com.geoattendance.entity.Geofence;
import com.geoattendance.entity.AttendanceRecord;
import com.geoattendance.entity.User;
import com.geoattendance.repository.GeofenceRepository;
import com.geoattendance.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeofencingService {
    
    private final GeofenceRepository geofenceRepository;
    private final AttendanceRepository attendanceRepository;
    private final NotificationService notificationService;
    
    /**
     * Check if a point (latitude, longitude) is inside a circular geofence
     */
    public boolean isPointInCircleGeofence(Double latitude, Double longitude, Geofence geofence) {
        if (geofence.getGeofenceType() != Geofence.GeofenceType.CIRCLE) {
            return false;
        }
        
        double distance = calculateDistance(
            latitude, longitude,
            geofence.getLatitude(), geofence.getLongitude()
        );
        
        return distance <= geofence.getRadiusMeters();
    }
    
    /**
     * Check if a point is inside a polygon geofence using ray casting algorithm
     */
    public boolean isPointInPolygonGeofence(Double latitude, Double longitude, Geofence geofence) {
        if (geofence.getGeofenceType() != Geofence.GeofenceType.POLYGON) {
            return false;
        }
        
        // Implementation of ray casting algorithm for polygon point-in-polygon test
        // This is a simplified version - production code should use more robust algorithms
        try {
            List<Map<String, Double>> coordinates = geofence.getPolygonCoordinates();
            if (coordinates == null || coordinates.isEmpty()) {
                return false;
            }
            
            // Ray casting algorithm implementation
            int crossings = 0;
            int n = coordinates.size();
            
            for (int i = 0; i < n; i++) {
                Map<String, Double> p1 = coordinates.get(i);
                Map<String, Double> p2 = coordinates.get((i + 1) % n);

                Double lat1d = p1.get("lat");
                Double lng1d = p1.get("lng");
                Double lat2d = p2.get("lat");
                Double lng2d = p2.get("lng");

                if (lat1d == null || lng1d == null || lat2d == null || lng2d == null) {
                    // skip malformed coordinate entries
                    continue;
                }

                double lat1 = lat1d;
                double lng1 = lng1d;
                double lat2 = lat2d;
                double lng2 = lng2d;

                if (isRayCrossing(latitude, longitude, lat1, lng1, lat2, lng2)) {
                    crossings++;
                }
            }
            
            return crossings % 2 == 1;
        } catch (Exception e) {
            log.error("Error checking polygon geofence", e);
            return false;
        }
    }
    
    /**
     * Check if a user is inside any active geofence
     */
    public Geofence findGeofenceContainingPoint(Double latitude, Double longitude) {
        List<Geofence> activeGeofences = geofenceRepository.findByIsActiveTrue();
        
        for (Geofence geofence : activeGeofences) {
            boolean isInside = geofence.getGeofenceType() == Geofence.GeofenceType.CIRCLE
                ? isPointInCircleGeofence(latitude, longitude, geofence)
                : isPointInPolygonGeofence(latitude, longitude, geofence);
            
            if (isInside) {
                return geofence;
            }
        }
        
        return null;
    }
    
    /**
     * Calculate distance between two points using Haversine formula (in meters)
     */
    public double calculateDistance(Double lat1, Double lng1, Double lat2, Double lng2) {
        final int R = 6371000; // Earth's radius in meters
        
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * Check if ray from point crosses a line segment
     */
    private boolean isRayCrossing(Double pointLat, Double pointLng, 
                                  Double lat1, Double lng1, Double lat2, Double lng2) {
        if ((lng1 <= pointLng && pointLng < lng2) || (lng2 <= pointLng && pointLng < lng1)) {
            double slope = (lat2 - lat1) / (lng2 - lng1);
            double latAtLng = lat1 + slope * (pointLng - lng1);
            return pointLat < latAtLng;
        }
        return false;
    }
    
    /**
     * Get all geofences (including inactive)
     */
    public List<Geofence> getAllGeofences() {
        return geofenceRepository.findAll();
    }
    
    /**
     * Get all active geofences
     */
    public List<Geofence> getAllActiveGeofences() {
        return geofenceRepository.findByIsActiveTrue();
    }
    
    /**
     * Create a new geofence
     */
    @Transactional
    public Geofence createGeofence(Geofence geofence) {
        log.info("Creating geofence: {}", geofence.getName());
        
        // Create GeoJsonPoint from latitude and longitude if not already set
        if (geofence.getLocation() == null && geofence.getLatitude() != null && geofence.getLongitude() != null) {
            geofence.setLocation(new org.springframework.data.mongodb.core.geo.GeoJsonPoint(
                geofence.getLongitude(), 
                geofence.getLatitude()
            ));
        }
        
        return geofenceRepository.save(geofence);
    }
    
    /**
     * Update an existing geofence
     */
    @Transactional
    public Geofence updateGeofence(String id, Geofence geofenceUpdate) {
        Geofence geofence = geofenceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Geofence not found"));
        
        geofence.setName(geofenceUpdate.getName());
        geofence.setDescription(geofenceUpdate.getDescription());
        geofence.setLocationName(geofenceUpdate.getLocationName());
        geofence.setLatitude(geofenceUpdate.getLatitude());
        geofence.setLongitude(geofenceUpdate.getLongitude());
        geofence.setRadiusMeters(geofenceUpdate.getRadiusMeters());
        geofence.setPolygonCoordinates(geofenceUpdate.getPolygonCoordinates());
        geofence.setGeofenceType(geofenceUpdate.getGeofenceType());
        geofence.setIsActive(geofenceUpdate.getIsActive());
        
        // Update GeoJsonPoint from latitude and longitude
        if (geofenceUpdate.getLatitude() != null && geofenceUpdate.getLongitude() != null) {
            geofence.setLocation(new org.springframework.data.mongodb.core.geo.GeoJsonPoint(
                geofenceUpdate.getLongitude(), 
                geofenceUpdate.getLatitude()
            ));
        }
        
        log.info("Updated geofence: {} - Active: {}", id, geofenceUpdate.getIsActive());
        return geofenceRepository.save(geofence);
    }
    
    /**
     * Delete a geofence
     */
    @Transactional
    public void deleteGeofence(String id) {
        geofenceRepository.deleteById(id);
        log.info("Deleted geofence: {}", id);
    }
    
    /**
     * Check geofence entry/exit and handle attendance
     */
    @Transactional
    public void handleGeofenceEvent(User user, Double latitude, Double longitude, Float accuracy) {
        Geofence currentGeofence = findGeofenceContainingPoint(latitude, longitude);
        
        // Get the latest attendance record for the user today

        Optional<AttendanceRecord> latestOpt = attendanceRepository.findFirstByUserIdOrderByCheckInTimeDesc(user.getId());
        AttendanceRecord latestRecord = latestOpt.orElse(null);
        
        if (currentGeofence != null) {
            // User is inside a geofence
            if (latestRecord == null || latestRecord.getCheckOutTime() != null) {
                // User just entered - create check-in record
                AttendanceRecord record = AttendanceRecord.builder()
                    .userId(user.getId())
                    .geofenceId(currentGeofence.getId())
                    .checkInLatitude(latitude)
                    .checkInLongitude(longitude)
                    .locationAccuracyMeters(accuracy)
                    .status(AttendanceRecord.AttendanceStatus.CHECKED_IN)
                    .build();
                
                attendanceRepository.save(record);
                log.info("User {} checked in at geofence {}", user.getId(), currentGeofence.getId());
                
                notificationService.sendCheckInNotification(user, currentGeofence);
            }
        } else {
            // User is outside all geofences
            if (latestRecord != null && latestRecord.getCheckOutTime() == null) {
                // User just exited - create check-out record
                latestRecord.setCheckOutLatitude(latitude);
                latestRecord.setCheckOutLongitude(longitude);
                latestRecord.setCheckOutTime(java.time.LocalDateTime.now());
                latestRecord.setStatus(AttendanceRecord.AttendanceStatus.CHECKED_OUT);
                
                attendanceRepository.save(latestRecord);
                log.info("User {} checked out", user.getId());
                
                notificationService.sendCheckOutNotification(user);
            }
        }
    }

    /**
     * Get a geofence by its ID
     */
    public Geofence getGeofenceById(String id) {
        return geofenceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Geofence not found: " + id));
    }
}
