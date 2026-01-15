package com.geoattendance.dto;

import lombok.Data;
import java.time.LocalTime;

@Data
public class WorkHoursRequest {
    private LocalTime workStartTime;      // e.g., 09:00
    private LocalTime workEndTime;        // e.g., 18:00
    private LocalTime checkInDeadline;    // e.g., 10:00 - after this = LATE
    private LocalTime checkOutAllowedFrom; // e.g., 17:00 - earliest checkout
    private Integer checkInBufferMinutes;  // Grace period before workStartTime
    private Integer checkOutBufferMinutes; // Grace period after checkOutAllowedFrom
}
