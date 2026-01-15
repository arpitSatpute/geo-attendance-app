package com.geoattendance.scheduler;

import com.geoattendance.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceScheduler {

    private final AttendanceService attendanceService;

    /**
     * Run every 5 minutes to check for employees who missed check-in deadline
     * and mark them as absent
     */
    @Scheduled(cron = "0 */5 * * * *") // Every 5 minutes
    public void markAbsentEmployees() {
        log.info("Running scheduled job: markAbsentEmployees");
        try {
            attendanceService.markAbsentEmployees();
            log.info("Completed scheduled job: markAbsentEmployees");
        } catch (Exception e) {
            log.error("Error in markAbsentEmployees scheduled job: {}", e.getMessage(), e);
        }
    }
}
