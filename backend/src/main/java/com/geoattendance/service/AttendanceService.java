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
     * Get team attendance records for a date range (for managers) - with user details
     */
    public List<TeamAttendanceRecord> getTeamAttendance(User manager, LocalDate startDate, LocalDate endDate) {
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

        List<AttendanceRecord> records = attendanceRepository.findByUserIdInAndCheckInTimeBetween(teamMemberIds, startDateTime, endDateTime);
        
        // Get all users for these records
        List<User> users = userRepository.findAllById(teamMemberIds);
        java.util.Map<String, User> userMap = new java.util.HashMap<>();
        for (User user : users) {
            userMap.put(user.getId(), user);
        }
        
        // Enrich records with user info
        return records.stream().map(record -> {
            User user = userMap.get(record.getUserId());
            return new TeamAttendanceRecord(record, user);
        }).collect(Collectors.toList());
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
     * First check-in must be within deadline, otherwise employee is marked absent
     */
    @Transactional
    public AttendanceRecord manualCheckIn(User user, Double latitude, Double longitude, Float accuracy) {
        // Check if user already has a record today
        AttendanceRecord todayRecord = getTodayAttendance(user);

        // If already marked absent, cannot check in anymore
        if (todayRecord != null && todayRecord.getStatus() == AttendanceRecord.AttendanceStatus.ABSENT) {
            log.warn("User {} was marked absent and cannot check in", user.getId());
            throw new RuntimeException("You were marked absent for today. Please contact your manager.");
        }

        if (todayRecord != null && todayRecord.getCheckOutTime() == null && 
            todayRecord.getStatus() != AttendanceRecord.AttendanceStatus.CHECKED_OUT) {
            log.warn("User {} already checked in today", user.getId());
            throw new RuntimeException("You are already checked in for today");
        }

        // Find geofence - user must be inside a designated area for first check-in
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

        // Validate work hours if configured for user's team (only for first check-in of the day)
        Team userTeam = teamRepository.findByEmployeeIdsContains(user.getId())
            .stream().findFirst().orElse(null);
        
        boolean isFirstCheckIn = (todayRecord == null);
        
        if (isFirstCheckIn && userTeam != null && userTeam.getWorkStartTime() != null) {
            LocalTime now = LocalTime.now();
            LocalTime earliestCheckIn = userTeam.getWorkStartTime()
                .minusMinutes(userTeam.getCheckInBufferMinutes() != null ? userTeam.getCheckInBufferMinutes() : 15);
            LocalTime latestCheckIn = userTeam.getCheckInDeadline() != null ? 
                userTeam.getCheckInDeadline() : userTeam.getWorkStartTime().plusHours(2);
            
            if (now.isBefore(earliestCheckIn)) {
                log.warn("User {} attempted early check-in at {}. Allowed from {}", 
                    user.getId(), now, earliestCheckIn);
                throw new RuntimeException("Check-in not allowed yet. You can check in from " + earliestCheckIn);
            }
            
            if (now.isAfter(latestCheckIn)) {
                // Mark as absent if deadline passed
                log.warn("User {} missed check-in deadline at {}. Deadline was {}", 
                    user.getId(), now, latestCheckIn);
                AttendanceRecord absentRecord = AttendanceRecord.builder()
                    .userId(user.getId())
                    .geofenceId(geofence.getId())
                    .checkInTime(LocalDateTime.now())
                    .status(AttendanceRecord.AttendanceStatus.ABSENT)
                    .build();
                attendanceRepository.save(absentRecord);
                throw new RuntimeException("Check-in deadline passed (" + latestCheckIn + "). You have been marked absent.");
            }
        }

        AttendanceRecord record;
        if (todayRecord != null && todayRecord.getStatus() == AttendanceRecord.AttendanceStatus.CHECKED_OUT) {
            // Re-checking in after checkout - update existing record
            todayRecord.setCheckOutTime(null);
            todayRecord.setStatus(AttendanceRecord.AttendanceStatus.CHECKED_IN);
            todayRecord.setCheckInLatitude(latitude);
            todayRecord.setCheckInLongitude(longitude);
            todayRecord.setLocationAccuracyMeters(accuracy);
            record = attendanceRepository.save(todayRecord);
        } else {
            record = AttendanceRecord.builder()
                .userId(user.getId())
                .geofenceId(geofence.getId())
                .checkInTime(LocalDateTime.now())
                .checkInLatitude(latitude)
                .checkInLongitude(longitude)
                .locationAccuracyMeters(accuracy)
                .status(AttendanceRecord.AttendanceStatus.CHECKED_IN)
                .build();
            record = attendanceRepository.save(record);
        }

        log.info("Manual check-in for user {} at geofence {}", user.getId(), geofence.getName());
        notificationService.sendCheckInNotification(user, geofence.getName());
        return record;
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

        // Validate work hours if configured for user's team
        Team userTeam = teamRepository.findByEmployeeIdsContains(user.getId())
            .stream().findFirst().orElse(null);
        
        if (userTeam != null && userTeam.getCheckOutAllowedFrom() != null) {
            LocalTime now = LocalTime.now();
            LocalTime earliestCheckOut = userTeam.getCheckOutAllowedFrom()
                .minusMinutes(userTeam.getCheckOutBufferMinutes() != null ? userTeam.getCheckOutBufferMinutes() : 0);
            
            if (now.isBefore(earliestCheckOut)) {
                log.warn("User {} attempted early check-out at {}. Allowed from {}", 
                    user.getId(), now, earliestCheckOut);
                throw new RuntimeException("Check-out not allowed yet. You can check out from " + earliestCheckOut);
            }
        }

        record.setCheckOutLatitude(latitude);
        record.setCheckOutLongitude(longitude);
        record.setCheckOutTime(LocalDateTime.now());
        record.setLocationAccuracyMeters(accuracy);
        record.setStatus(AttendanceRecord.AttendanceStatus.CHECKED_OUT);

        log.info("Manual check-out for user {}", user.getId());
        AttendanceRecord saved = attendanceRepository.save(record);
        notificationService.sendCheckOutNotification(user);
        return saved;
    }

    /**
     * Process location update and auto check-in/check-out based on geofence
     * This is called when employee's location changes
     */
    @Transactional
    public LocationUpdateResult processLocationUpdate(User user, Double latitude, Double longitude, Float accuracy) {
        AttendanceRecord todayRecord = getTodayAttendance(user);
        
        // If user is marked absent, ignore location updates
        if (todayRecord != null && todayRecord.getStatus() == AttendanceRecord.AttendanceStatus.ABSENT) {
            return new LocationUpdateResult("ABSENT", "You are marked absent for today", null);
        }
        
        // Check if user has completed first check-in
        boolean hasFirstCheckIn = todayRecord != null && todayRecord.getCheckInTime() != null;
        
        // If no first check-in yet, location tracking doesn't auto-check-in
        // User must manually check-in first within deadline
        if (!hasFirstCheckIn) {
            var geofence = geofencingService.findGeofenceContainingPoint(latitude, longitude);
            if (geofence != null) {
                return new LocationUpdateResult("AWAITING_FIRST_CHECKIN", 
                    "You are in the geofence area. Please check in manually.", geofence.getName());
            }
            return new LocationUpdateResult("OUTSIDE", "You are outside the work area", null);
        }
        
        // After first check-in, auto check-in/check-out based on location
        var geofence = geofencingService.findGeofenceContainingPoint(latitude, longitude);
        
        if (geofence != null && geofence.getIsActive()) {
            // User is inside geofence
            if (todayRecord.getStatus() == AttendanceRecord.AttendanceStatus.CHECKED_OUT) {
                // Auto check back in
                todayRecord.setCheckOutTime(null);
                todayRecord.setStatus(AttendanceRecord.AttendanceStatus.CHECKED_IN);
                todayRecord.setCheckInLatitude(latitude);
                todayRecord.setCheckInLongitude(longitude);
                todayRecord.setLocationAccuracyMeters(accuracy);
                attendanceRepository.save(todayRecord);
                notificationService.sendCheckInNotification(user, geofence.getName());
                log.info("Auto check-in for user {} at geofence {}", user.getId(), geofence.getName());
                return new LocationUpdateResult("AUTO_CHECKED_IN", 
                    "You are back in the work area. Checked in automatically.", geofence.getName());
            }
            return new LocationUpdateResult("CHECKED_IN", "You are in the work area", geofence.getName());
        } else {
            // User is outside geofence
            if (todayRecord.getStatus() == AttendanceRecord.AttendanceStatus.CHECKED_IN) {
                // Auto check out
                todayRecord.setCheckOutLatitude(latitude);
                todayRecord.setCheckOutLongitude(longitude);
                todayRecord.setCheckOutTime(LocalDateTime.now());
                todayRecord.setLocationAccuracyMeters(accuracy);
                todayRecord.setStatus(AttendanceRecord.AttendanceStatus.CHECKED_OUT);
                attendanceRepository.save(todayRecord);
                notificationService.sendCheckOutNotification(user);
                log.info("Auto check-out for user {} - left geofence area", user.getId());
                return new LocationUpdateResult("AUTO_CHECKED_OUT", 
                    "You left the work area. Checked out automatically.", null);
            }
            return new LocationUpdateResult("CHECKED_OUT", "You are outside the work area", null);
        }
    }

    /**
     * Mark employees as absent who missed check-in deadline (scheduled job)
     */
    @Transactional
    public void markAbsentEmployees() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        LocalTime now = LocalTime.now();
        
        // Get all teams with work hours configured
        List<Team> teamsWithWorkHours = teamRepository.findAll().stream()
            .filter(t -> t.getWorkStartTime() != null && t.getCheckInDeadline() != null)
            .filter(t -> now.isAfter(t.getCheckInDeadline()))
            .toList();
        
        for (Team team : teamsWithWorkHours) {
            if (team.getEmployeeIds() == null) continue;
            
            for (String employeeId : team.getEmployeeIds()) {
                // Check if employee has checked in today
                List<AttendanceRecord> todayRecords = attendanceRepository
                    .findByUserIdAndCheckInTimeBetween(employeeId, startOfDay, endOfDay);
                
                if (todayRecords.isEmpty()) {
                    // No check-in record - mark as absent
                    AttendanceRecord absentRecord = AttendanceRecord.builder()
                        .userId(employeeId)
                        .checkInTime(LocalDateTime.now())
                        .status(AttendanceRecord.AttendanceStatus.ABSENT)
                        .build();
                    attendanceRepository.save(absentRecord);
                    log.info("Marked employee {} as absent - missed check-in deadline", employeeId);
                }
            }
        }
    }

    // DTO for location update result
    public static class LocationUpdateResult {
        private String status;
        private String message;
        private String geofenceName;
        
        public LocationUpdateResult(String status, String message, String geofenceName) {
            this.status = status;
            this.message = message;
            this.geofenceName = geofenceName;
        }
        
        public String getStatus() { return status; }
        public String getMessage() { return message; }
        public String getGeofenceName() { return geofenceName; }
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
     * Auto check-out users who are still checked in after their team's work hours
     */
    @Transactional
    public void autoCheckOutPastWorkHours() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        LocalTime now = LocalTime.now();

        List<Team> teams = teamRepository.findAll();
        for (Team team : teams) {
            if (team.getWorkEndTime() == null || team.getEmployeeIds() == null) continue;

            if (now.isAfter(team.getWorkEndTime())) {
                for (String employeeId : team.getEmployeeIds()) {
                    List<AttendanceRecord> records = attendanceRepository
                        .findByUserIdAndCheckInTimeBetween(employeeId, startOfDay, endOfDay);

                    for (AttendanceRecord record : records) {
                        if (record.getCheckOutTime() == null && record.getStatus() == AttendanceRecord.AttendanceStatus.CHECKED_IN) {
                            // Set checkout time exactly to their work end time
                            record.setCheckOutTime(LocalDateTime.of(LocalDate.now(), team.getWorkEndTime()));
                            record.setStatus(AttendanceRecord.AttendanceStatus.CHECKED_OUT);
                            attendanceRepository.save(record);
                            log.info("Auto checked out employee {} at the end of work hours ({})", employeeId, team.getWorkEndTime());
                        }
                    }
                }
            }
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

    // DTO for team attendance records with user info
    public static class TeamAttendanceRecord {
        private String id;
        private String userId;
        private String userName;
        private String userEmail;
        private String geofenceId;
        private LocalDateTime checkInTime;
        private LocalDateTime checkOutTime;
        private Double checkInLatitude;
        private Double checkInLongitude;
        private Double checkOutLatitude;
        private Double checkOutLongitude;
        private Float locationAccuracyMeters;
        private AttendanceRecord.AttendanceStatus status;
        
        public TeamAttendanceRecord(AttendanceRecord record, User user) {
            this.id = record.getId();
            this.userId = record.getUserId();
            this.userName = user != null ? (user.getFirstName() + " " + user.getLastName()) : "Unknown";
            this.userEmail = user != null ? user.getEmail() : "";
            this.geofenceId = record.getGeofenceId();
            this.checkInTime = record.getCheckInTime();
            this.checkOutTime = record.getCheckOutTime();
            this.checkInLatitude = record.getCheckInLatitude();
            this.checkInLongitude = record.getCheckInLongitude();
            this.checkOutLatitude = record.getCheckOutLatitude();
            this.checkOutLongitude = record.getCheckOutLongitude();
            this.locationAccuracyMeters = record.getLocationAccuracyMeters();
            this.status = record.getStatus();
        }
        
        // Getters
        public String getId() { return id; }
        public String getUserId() { return userId; }
        public String getUserName() { return userName; }
        public String getUserEmail() { return userEmail; }
        public String getGeofenceId() { return geofenceId; }
        public LocalDateTime getCheckInTime() { return checkInTime; }
        public LocalDateTime getCheckOutTime() { return checkOutTime; }
        public Double getCheckInLatitude() { return checkInLatitude; }
        public Double getCheckInLongitude() { return checkInLongitude; }
        public Double getCheckOutLatitude() { return checkOutLatitude; }
        public Double getCheckOutLongitude() { return checkOutLongitude; }
        public Float getLocationAccuracyMeters() { return locationAccuracyMeters; }
        public AttendanceRecord.AttendanceStatus getStatus() { return status; }
    }
}
