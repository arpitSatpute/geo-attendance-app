package com.geoattendance.controller;

import com.geoattendance.entity.AttendanceRecord;
import com.geoattendance.entity.User;
import com.geoattendance.service.AttendanceService;
import com.geoattendance.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

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
    public ResponseEntity<AttendanceRecord> checkIn(
        @RequestParam Double latitude,
        @RequestParam Double longitude,
        @RequestParam(required = false) Float accuracy
    ) {
        User currentUser = authenticationService.getCurrentUser();
        AttendanceRecord record = attendanceService.manualCheckIn(currentUser, latitude, longitude, accuracy);
        return ResponseEntity.ok(record);
    }
    
    /**
     * Manual check-out
     */
    @PostMapping("/check-out")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<AttendanceRecord> checkOut(
        @RequestParam Double latitude,
        @RequestParam Double longitude,
        @RequestParam(required = false) Float accuracy
    ) {
        User currentUser = authenticationService.getCurrentUser();
        AttendanceRecord record = attendanceService.manualCheckOut(currentUser, latitude, longitude, accuracy);
        return ResponseEntity.ok(record);
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
