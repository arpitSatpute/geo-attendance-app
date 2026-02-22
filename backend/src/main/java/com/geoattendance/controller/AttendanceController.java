package com.geoattendance.controller;

import com.geoattendance.entity.AttendanceRecord;
import com.geoattendance.entity.Team;
import com.geoattendance.entity.User;
import com.geoattendance.repository.UserRepository;
import com.geoattendance.service.AttendanceService;
import com.geoattendance.service.AuthenticationService;
import com.geoattendance.service.TeamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
@Slf4j
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final AuthenticationService authenticationService;
    private final TeamService teamService;
    private final UserRepository userRepository;

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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        User currentUser = authenticationService.getCurrentUser();
        List<AttendanceRecord> records = attendanceService.getAttendanceHistory(currentUser, startDate, endDate);
        return ResponseEntity.ok(records);
    }

    /**
     * Get team attendance (for managers) - includes user name and email
     */
    @GetMapping("/team")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<AttendanceService.TeamAttendanceRecord>> getTeamAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        User currentUser = authenticationService.getCurrentUser();
        List<AttendanceService.TeamAttendanceRecord> records = attendanceService.getTeamAttendance(currentUser,
                startDate, endDate);
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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        User currentUser = authenticationService.getCurrentUser();
        AttendanceService.AttendanceStatistics stats = attendanceService.getAttendanceStatistics(currentUser, startDate,
                endDate);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get attendance statistics for a specific employee (for managers)
     */
    @GetMapping("/employee/{userId}/statistics")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> getEmployeeStatistics(
            @PathVariable String userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            User employee = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            AttendanceService.AttendanceStatistics stats = attendanceService.getAttendanceStatistics(employee,
                    startDate, endDate);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching employee statistics: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get attendance history for a specific employee (for managers)
     */
    @GetMapping("/employee/{userId}/history")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> getEmployeeHistory(
            @PathVariable String userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            User employee = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            List<AttendanceRecord> records = attendanceService.getAttendanceHistory(employee, startDate, endDate);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            log.error("Error fetching employee history: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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
                    request.getAccuracy());
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
                    request.getAccuracy());
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

        public Double getLatitude() {
            return latitude;
        }

        public void setLatitude(Double latitude) {
            this.latitude = latitude;
        }

        public Double getLongitude() {
            return longitude;
        }

        public void setLongitude(Double longitude) {
            this.longitude = longitude;
        }

        public Float getAccuracy() {
            return accuracy;
        }

        public void setAccuracy(Float accuracy) {
            this.accuracy = accuracy;
        }
    }

    /**
     * Get attendance report
     */
    @GetMapping("/report")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<AttendanceService.AttendanceReport> getReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        User currentUser = authenticationService.getCurrentUser();
        AttendanceService.AttendanceReport report = attendanceService.getAttendanceReport(currentUser, startDate,
                endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Get work hours for current employee
     */
    @GetMapping("/work-hours")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getMyWorkHours() {
        User currentUser = authenticationService.getCurrentUser();
        Optional<Team> teamOpt = teamService.getTeamByEmployeeId(currentUser.getId());

        Map<String, Object> response = new HashMap<>();

        if (teamOpt.isEmpty()) {
            response.put("configured", false);
            response.put("message", "You are not assigned to any team");
            return ResponseEntity.ok(response);
        }

        Team team = teamOpt.get();

        if (team.getWorkStartTime() == null) {
            response.put("configured", false);
            response.put("message", "Work hours are not configured for your team");
            return ResponseEntity.ok(response);
        }

        response.put("configured", true);
        response.put("teamName", team.getName());
        response.put("workStartTime", team.getWorkStartTime().toString());
        response.put("workEndTime", team.getWorkEndTime() != null ? team.getWorkEndTime().toString() : null);
        response.put("checkInDeadline",
                team.getCheckInDeadline() != null ? team.getCheckInDeadline().toString() : null);
        response.put("checkOutAllowedFrom",
                team.getCheckOutAllowedFrom() != null ? team.getCheckOutAllowedFrom().toString() : null);
        response.put("checkInBufferMinutes", team.getCheckInBufferMinutes());
        response.put("checkOutBufferMinutes", team.getCheckOutBufferMinutes());

        // Calculate actual allowed times
        if (team.getWorkStartTime() != null) {
            int buffer = team.getCheckInBufferMinutes() != null ? team.getCheckInBufferMinutes() : 15;
            response.put("earliestCheckIn", team.getWorkStartTime().minusMinutes(buffer).toString());
        }

        return ResponseEntity.ok(response);
    }
}
