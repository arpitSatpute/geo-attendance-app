package com.geoattendance.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "teams")
public class Team {
    @Id
    private String id;
    private String name;
    private String managerId;
    private List<String> employeeIds;
    private String geofenceId; // The geofence associated with this team
    
    // Work hours configuration - set by manager
    private LocalTime workStartTime;  // e.g., 09:00 - earliest check-in allowed
    private LocalTime workEndTime;    // e.g., 18:00 - latest check-out expected
    private LocalTime checkInDeadline; // e.g., 10:00 - after this time, marked as LATE
    private LocalTime checkOutAllowedFrom; // e.g., 17:00 - earliest check-out allowed
    
    // Buffer time in minutes (grace period)
    @Builder.Default
    private Integer checkInBufferMinutes = 15; // Allow check-in 15 mins before workStartTime
    @Builder.Default
    private Integer checkOutBufferMinutes = 0; // No buffer for check-out by default
}
