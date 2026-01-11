package com.geoattendance.service;

import com.geoattendance.entity.AttendanceRecord;
import com.geoattendance.entity.User;
import com.geoattendance.repository.AttendanceRepository;
import com.geoattendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {
    
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final GeofencingService geofencingService;
    private final NotificationService notificationService;
    
    /**
     * Get today's attendance record for a user
     */
    public AttendanceRecord getTodayAttendance(User user) {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        
        return attendanceRepository.findByUserIdAndCheckInTimeBetween(user.getId(), startOfDay, endOfDay)
            .stream()
            .findFirst()
            .orElse(null);
    }
    
    /**
     * Get attendance records for a date range
     */
    public List<AttendanceRecord> getAttendanceHistory(User user, LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime endDateTime = LocalDateTime.of(endDate, LocalTime.MAX);
        
        return attendanceRepository.findByUserIdAndCheckInTimeBetween(user.getId(), startDateTime, endDateTime);
    }
    
    /**
     * Get team attendance records for a date range (for managers)
     */
    public List<AttendanceRecord> getTeamAttendance(User manager, LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime endDateTime = LocalDateTime.of(endDate, LocalTime.MAX);
        
        // Get all subordinates of the manager from UserRepository
        List<User> teamMembers = userRepository.findByManagerId(manager.getId());
        List<String> teamMemberIds = teamMembers.stream()
            .map(User::getId)
            .collect(Collectors.toList());

        if (teamMemberIds.isEmpty()) {
            return List.of();
        }

        return attendanceRepository.findByUserIdInAndCheckInTimeBetween(teamMemberIds, startDateTime, endDateTime);
    }
    
    /**
     * Calculate attendance statistics for a user
     */
    public AttendanceStatistics getAttendanceStatistics(User user, LocalDate startDate, LocalDate endDate) {
        List<AttendanceRecord> records = getAttendanceHistory(user, startDate, endDate);
        
        long totalDays = startDate.until(endDate).getDays();
        long presentDays = records.stream()
            .filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.CHECKED_OUT)
            .count();
        long lateDays = records.stream()
            .filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.LATE)
            .count();
        long absentDays = totalDays - presentDays;
        
        double attendancePercentage = totalDays > 0 ? (presentDays * 100.0) / totalDays : 0;
        
        return AttendanceStatistics.builder()
            .totalDays(totalDays)
            .presentDays(presentDays)
            .absentDays(absentDays)
            .lateDays(lateDays)
            .attendancePercentage(attendancePercentage)
            .build();
    }
    
    /**
     * Manual check-in (for emergency or offline scenarios)
     */
    @Transactional
    public AttendanceRecord manualCheckIn(User user, Double latitude, Double longitude, Float accuracy) {
        // Check if user already has a check-in today
        AttendanceRecord todayRecord = getTodayAttendance(user);
        
        if (todayRecord != null && todayRecord.getCheckOutTime() == null) {
            log.warn("User {} already checked in today", user.getId());
            throw new RuntimeException("User already checked in today");
        }
        
        // Find geofence if user is inside one
        var geofence = geofencingService.findGeofenceContainingPoint(latitude, longitude);
        
        AttendanceRecord record = AttendanceRecord.builder()
            .userId(user.getId())
            .geofenceId(geofence != null ? geofence.getId() : null)
            .checkInLatitude(latitude)
            .checkInLongitude(longitude)
            .locationAccuracyMeters(accuracy)
            .status(AttendanceRecord.AttendanceStatus.CHECKED_IN)
            .build();
        
        log.info("Manual check-in for user {}", user.getId());
        return attendanceRepository.save(record);
    }
    
    /**
     * Manual check-out
     */
    @Transactional
    public AttendanceRecord manualCheckOut(User user, Double latitude, Double longitude, Float accuracy) {
        AttendanceRecord record = getTodayAttendance(user);
        
        if (record == null || record.getCheckOutTime() != null) {
            log.warn("No active check-in found for user {}", user.getId());
            throw new RuntimeException("No active check-in found");
        }
        
        record.setCheckOutLatitude(latitude);
        record.setCheckOutLongitude(longitude);
        record.setCheckOutTime(LocalDateTime.now());
        record.setLocationAccuracyMeters(accuracy);
        record.setStatus(AttendanceRecord.AttendanceStatus.CHECKED_OUT);
        
        log.info("Manual check-out for user {}", user.getId());
        return attendanceRepository.save(record);
    }
    
    /**
     * Get attendance report for a user
     */
    public AttendanceReport getAttendanceReport(User user, LocalDate startDate, LocalDate endDate) {
        List<AttendanceRecord> records = getAttendanceHistory(user, startDate, endDate);
        AttendanceStatistics stats = getAttendanceStatistics(user, startDate, endDate);
        
        return AttendanceReport.builder()
            .user(user)
            .startDate(startDate)
            .endDate(endDate)
            .records(records)
            .statistics(stats)
            .generatedAt(LocalDateTime.now())
            .build();
    }
    
    /**
     * Auto check-out users who are still checked in after work hours
     */
    @Transactional
    public void autoCheckOutUsers(LocalTime checkOutTime) {
        List<AttendanceRecord> activeRecords = attendanceRepository.findByCheckOutTimeIsNull();

        for (AttendanceRecord record : activeRecords) {
            LocalDateTime checkOutDateTime = LocalDateTime.of(LocalDate.now(), checkOutTime);
            record.setCheckOutTime(checkOutDateTime);
            record.setStatus(AttendanceRecord.AttendanceStatus.CHECKED_OUT);
            attendanceRepository.save(record);
            
            log.info("Auto checked out user {}", record.getUserId());
        }
    }
    
    /**
     * Detect late arrivals
     */
    @Transactional
    public void detectLateArrivals(LocalTime lateThreshold) {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        List<AttendanceRecord> todayRecords = attendanceRepository.findByCheckInTimeBetween(startOfDay, endOfDay);

        for (AttendanceRecord record : todayRecords) {
            if (record.getCheckInTime() != null && 
                record.getCheckInTime().toLocalTime().isAfter(lateThreshold)) {
                record.setStatus(AttendanceRecord.AttendanceStatus.LATE);
                attendanceRepository.save(record);
                
                // Notify by userId -> fetch user if needed
                if (record.getUserId() != null) {
                    userRepository.findById(record.getUserId()).ifPresent(notificationService::sendLateArrivalNotification);
                }
                log.info("User {} marked as late", record.getUserId());
            }
        }
    }
    
    // DTOs for responses
    @lombok.Data
    @lombok.Builder
    public static class AttendanceStatistics {
        private long totalDays;
        private long presentDays;
        private long absentDays;
        private long lateDays;
        private double attendancePercentage;
    }
    
    @lombok.Data
    @lombok.Builder
    public static class AttendanceReport {
        private User user;
        private LocalDate startDate;
        private LocalDate endDate;
        private List<AttendanceRecord> records;
        private AttendanceStatistics statistics;
        private LocalDateTime generatedAt;
    }
}
