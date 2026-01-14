package com.geoattendance.controller;

import com.geoattendance.entity.AttendanceRecord;
import com.geoattendance.entity.User;
import com.geoattendance.service.AttendanceService;
import com.geoattendance.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
@Slf4j
public class AttendanceController {
    
    private final AttendanceService attendanceService;
    private final AuthenticationService authenticationService;
    
    /**
     * Get today's attendance for current user
     */
    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<AttendanceRecord> getTodayAttendance() {
        User currentUser = authenticationService.getCurrentUser();
        AttendanceRecord record = attendanceService.getTodayAttendance(currentUser);
        return ResponseEntity.ok(record);
    }
    
    /**
     * Get attendance history for current user
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceHistory(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        User currentUser = authenticationService.getCurrentUser();
        List<AttendanceRecord> records = attendanceService.getAttendanceHistory(currentUser, startDate, endDate);
        return ResponseEntity.ok(records);
    }
    
    /**
     * Get team attendance (for managers)
     */
    @GetMapping("/team")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<AttendanceRecord>> getTeamAttendance(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        User currentUser = authenticationService.getCurrentUser();
        List<AttendanceRecord> records = attendanceService.getTeamAttendance(currentUser, startDate, endDate);
        return ResponseEntity.ok(records);
    }

    /**
     * Get current status of all team members (for manager dashboard)
     */
    @GetMapping("/team/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<AttendanceService.TeamMemberStatus>> getTeamStatus() {
        User currentUser = authenticationService.getCurrentUser();
        List<AttendanceService.TeamMemberStatus> status = attendanceService.getTeamCurrentStatus(currentUser);
        return ResponseEntity.ok(status);
    }
    
    /**
     * Get attendance statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<AttendanceService.AttendanceStatistics> getStatistics(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        User currentUser = authenticationService.getCurrentUser();
        AttendanceService.AttendanceStatistics stats = attendanceService.getAttendanceStatistics(currentUser, startDate, endDate);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Manual check-in
     */
    @PostMapping("/check-in")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<?> checkIn(@RequestBody CheckInRequest request) {
        try {
            User currentUser = authenticationService.getCurrentUser();
            AttendanceRecord record = attendanceService.manualCheckIn(
                currentUser, 
                request.getLatitude(), 
                request.getLongitude(), 
                request.getAccuracy()
            );
            return ResponseEntity.ok(record);
        } catch (RuntimeException e) {
            log.error("Check-in failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage(), "message", e.getMessage()));
        }
    }
    
    /**
     * Manual check-out
     */
    @PostMapping("/check-out")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<?> checkOut(@RequestBody CheckInRequest request) {
        try {
            User currentUser = authenticationService.getCurrentUser();
            AttendanceRecord record = attendanceService.manualCheckOut(
                currentUser, 
                request.getLatitude(), 
                request.getLongitude(), 
                request.getAccuracy()
            );
            return ResponseEntity.ok(record);
        } catch (RuntimeException e) {
            log.error("Check-out failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage(), "message", e.getMessage()));
        }
    }
    
    // Request DTOs
    public static class CheckInRequest {
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
    
    /**
     * Get attendance report
     */
    @GetMapping("/report")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<AttendanceService.AttendanceReport> getReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        User currentUser = authenticationService.getCurrentUser();
        AttendanceService.AttendanceReport report = attendanceService.getAttendanceReport(currentUser, startDate, endDate);
        return ResponseEntity.ok(report);
    }
}
