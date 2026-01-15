package com.geoattendance.controller;

import com.geoattendance.entity.User;
import com.geoattendance.service.AttendanceService;
import com.geoattendance.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/location")
@RequiredArgsConstructor
@Slf4j
public class LocationController {

    private final AttendanceService attendanceService;
    private final AuthenticationService authenticationService;

    /**
     * Update employee location and auto check-in/check-out based on geofence
     */
    @PostMapping("/update")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<?> updateLocation(@RequestBody LocationUpdateRequest request) {
        try {
            User currentUser = authenticationService.getCurrentUser();
            AttendanceService.LocationUpdateResult result = attendanceService.processLocationUpdate(
                currentUser,
                request.getLatitude(),
                request.getLongitude(),
                request.getAccuracy()
            );
            
            return ResponseEntity.ok(Map.of(
                "status", result.getStatus(),
                "message", result.getMessage(),
                "geofenceName", result.getGeofenceName() != null ? result.getGeofenceName() : ""
            ));
        } catch (Exception e) {
            log.error("Location update failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "status", "ERROR"
            ));
        }
    }

    public static class LocationUpdateRequest {
        private Double latitude;
        private Double longitude;
        private Float accuracy;

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }

        public Float getAccuracy() { return accuracy; }
        public void setAccuracy(Float accuracy) { this.accuracy = accuracy; }
    }
}
