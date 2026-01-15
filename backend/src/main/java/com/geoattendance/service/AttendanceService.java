package com.geoattendance.service;

import com.geoattendance.entity.AttendanceRecord;
import com.geoattendance.entity.Team;
import com.geoattendance.entity.User;
import com.geoattendance.repository.AttendanceRepository;
import com.geoattendance.repository.TeamRepository;
import com.geoattendance.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceService.class);

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final GeofencingService geofencingService;
    private final NotificationService notificationService;

    // Explicit constructor replaces Lombok @RequiredArgsConstructor
    public AttendanceService(AttendanceRepository attendanceRepository,
                             UserRepository userRepository,
                             TeamRepository teamRepository,
                             GeofencingService geofencingService,
                             NotificationService notificationService) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.geofencingService = geofencingService;
        this.notificationService = notificationService;
    }

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

        // Get all team members from teams managed by this manager
        List<Team> teams = teamRepository.findByManagerId(manager.getId());
        List<String> teamMemberIds = new ArrayList<>();
        for (Team team : teams) {
            if (team.getEmployeeIds() != null) {
                teamMemberIds.addAll(team.getEmployeeIds());
            }
        }

        if (teamMemberIds.isEmpty()) {
            return List.of();
        }

        return attendanceRepository.findByUserIdInAndCheckInTimeBetween(teamMemberIds, startDateTime, endDateTime);
    }

    /**
     * Get current status of all team members (for manager dashboard)
     */
    public List<TeamMemberStatus> getTeamCurrentStatus(User manager) {
        // Get all teams managed by this manager
        List<Team> teams = teamRepository.findByManagerId(manager.getId());
        
        // Collect all employee IDs from all teams
        List<String> allEmployeeIds = new ArrayList<>();
        for (Team team : teams) {
            if (team.getEmployeeIds() != null) {
                allEmployeeIds.addAll(team.getEmployeeIds());
            }
        }
        
        // Get all team members
        List<User> teamMembers = allEmployeeIds.isEmpty() ? 
            List.of() : userRepository.findAllById(allEmployeeIds);
        
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        
        return teamMembers.stream().map(member -> {
            AttendanceRecord todayRecord = attendanceRepository
                .findByUserIdAndCheckInTimeBetween(member.getId(), startOfDay, endOfDay)
                .stream()
                .findFirst()
                .orElse(null);
            
            String status;
            String checkInTime = null;
            String checkOutTime = null;
            
            if (todayRecord == null) {
                status = "ABSENT";
            } else if (todayRecord.getCheckOutTime() != null) {
                status = "CHECKED_OUT";
                checkInTime = todayRecord.getCheckInTime().toString();
                checkOutTime = todayRecord.getCheckOutTime().toString();
            } else {
                status = "CHECKED_IN";
                checkInTime = todayRecord.getCheckInTime().toString();
            }
            
            return TeamMemberStatus.builder()
                .userId(member.getId())
                .firstName(member.getFirstName())
                .lastName(member.getLastName())
                .email(member.getEmail())
                .status(status)
                .checkInTime(checkInTime)
                .checkOutTime(checkOutTime)
                .build();
        }).collect(Collectors.toList());
    }

    /**
     * Calculate attendance statistics for a user
     */
    public AttendanceStatistics getAttendanceStatistics(User user, LocalDate startDate, LocalDate endDate) {
        List<AttendanceRecord> records = getAttendanceHistory(user, startDate, endDate);

        long totalDays = startDate.until(endDate).getDays();
        // Count both CHECKED_IN and CHECKED_OUT as present (CHECKED_IN means still at work)
        long presentDays = records.stream()
            .filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.CHECKED_OUT ||
                         r.getStatus() == AttendanceRecord.AttendanceStatus.CHECKED_IN)
            .count();
        long lateDays = records.stream()
            .filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.LATE)
            .count();
        long absentDays = totalDays - presentDays - lateDays;

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
            throw new RuntimeException("You are already checked in for today");
        }

        // Find geofence - user must be inside a designated area
        var geofence = geofencingService.findGeofenceContainingPoint(latitude, longitude);
        
        if (geofence == null) {
            log.warn("User {} attempted check-in outside designated area at {}, {}", 
                user.getId(), latitude, longitude);
            throw new RuntimeException("You are outside the designated area. Please move to your assigned location to check in.");
        }
        
        if (!geofence.getIsActive()) {
            log.warn("User {} attempted check-in at inactive geofence {}", user.getId(), geofence.getId());
            throw new RuntimeException("This location is currently inactive. Please contact your manager.");
        }

        AttendanceRecord record = AttendanceRecord.builder()
            .userId(user.getId())
            .geofenceId(geofence.getId())
            .checkInTime(LocalDateTime.now())
            .checkInLatitude(latitude)
            .checkInLongitude(longitude)
            .locationAccuracyMeters(accuracy)
            .status(AttendanceRecord.AttendanceStatus.CHECKED_IN)
            .build();

        log.info("Manual check-in for user {} at geofence {}", user.getId(), geofence.getName());
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

    // DTOs for responses - replace Lombok builders with simple static builder implementations
    public static class AttendanceStatistics {
        private long totalDays;
        private long presentDays;
        private long absentDays;
        private long lateDays;
        private double attendancePercentage;

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private final AttendanceStatistics instance = new AttendanceStatistics();
            public Builder totalDays(long v) { instance.totalDays = v; return this; }
            public Builder presentDays(long v) { instance.presentDays = v; return this; }
            public Builder absentDays(long v) { instance.absentDays = v; return this; }
            public Builder lateDays(long v) { instance.lateDays = v; return this; }
            public Builder attendancePercentage(double v) { instance.attendancePercentage = v; return this; }
            public AttendanceStatistics build() { return instance; }
        }

        // Getters
        public long getTotalDays() { return totalDays; }
        public long getPresentDays() { return presentDays; }
        public long getAbsentDays() { return absentDays; }
        public long getLateDays() { return lateDays; }
        public double getAttendancePercentage() { return attendancePercentage; }
    }

    public static class AttendanceReport {
        private User user;
        private LocalDate startDate;
        private LocalDate endDate;
        private List<AttendanceRecord> records;
        private AttendanceStatistics statistics;
        private LocalDateTime generatedAt;

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private final AttendanceReport instance = new AttendanceReport();
            public Builder user(User u) { instance.user = u; return this; }
            public Builder startDate(LocalDate d) { instance.startDate = d; return this; }
            public Builder endDate(LocalDate d) { instance.endDate = d; return this; }
            public Builder records(List<AttendanceRecord> r) { instance.records = r; return this; }
            public Builder statistics(AttendanceStatistics s) { instance.statistics = s; return this; }
            public Builder generatedAt(LocalDateTime t) { instance.generatedAt = t; return this; }
            public AttendanceReport build() { return instance; }
        }

        // Getters
        public User getUser() { return user; }
        public LocalDate getStartDate() { return startDate; }
        public LocalDate getEndDate() { return endDate; }
        public List<AttendanceRecord> getRecords() { return records; }
        public AttendanceStatistics getStatistics() { return statistics; }
        public LocalDateTime getGeneratedAt() { return generatedAt; }
    }

    public static class TeamMemberStatus {
        private String userId;
        private String firstName;
        private String lastName;
        private String email;
        private String status;
        private String checkInTime;
        private String checkOutTime;

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private final TeamMemberStatus instance = new TeamMemberStatus();
            public Builder userId(String v) { instance.userId = v; return this; }
            public Builder firstName(String v) { instance.firstName = v; return this; }
            public Builder lastName(String v) { instance.lastName = v; return this; }
            public Builder email(String v) { instance.email = v; return this; }
            public Builder status(String v) { instance.status = v; return this; }
            public Builder checkInTime(String v) { instance.checkInTime = v; return this; }
            public Builder checkOutTime(String v) { instance.checkOutTime = v; return this; }
            public TeamMemberStatus build() { return instance; }
        }

        // Getters
        public String getUserId() { return userId; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
        public String getEmail() { return email; }
        public String getStatus() { return status; }
        public String getCheckInTime() { return checkInTime; }
        public String getCheckOutTime() { return checkOutTime; }
    }
}
