package com.geoattendance.controller;

import com.geoattendance.dto.SalaryCalculationRequest;
import com.geoattendance.dto.SalaryResponse;
import com.geoattendance.service.AuthenticationService;
import com.geoattendance.service.SalaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/salary")
public class SalaryController {

    private static final Logger log = LoggerFactory.getLogger(SalaryController.class);

    private final SalaryService salaryService;
    private final AuthenticationService authenticationService;

    public SalaryController(SalaryService salaryService, AuthenticationService authenticationService) {
        this.salaryService = salaryService;
        this.authenticationService = authenticationService;
    }

    /**
     * Manager/Admin endpoint to calculate salary for an employee
     */
    @PostMapping("/calculate")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> calculateSalary(@RequestBody SalaryCalculationRequest request) {
        try {
            String calculatedBy = getCurrentUserId();
            SalaryResponse response = salaryService.calculateMonthlySalary(request, calculatedBy);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error calculating salary: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Employee endpoint to view their own salary for a specific month
     */
    @GetMapping("/my-salary")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<?> getMySalary(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        try {
            String userId = getCurrentUserId();
            SalaryResponse response = salaryService.getMySalary(userId, year, month);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching salary: {}", e.getMessage(), e);
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage(), "message", e.getMessage()));
        }
    }

    /**
     * Employee endpoint to view their salary history
     */
    @GetMapping("/my-salary/history")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<SalaryResponse>> getMySalaryHistory() {
        try {
            String userId = getCurrentUserId();
            List<SalaryResponse> response = salaryService.getMySalaryHistory(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching salary history: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Manager/Admin endpoint to view a specific employee's salary history
     */
    @GetMapping("/employee/{userId}/history")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<SalaryResponse>> getEmployeeSalaryHistory(@PathVariable String userId) {
        try {
            List<SalaryResponse> response = salaryService.getMySalaryHistory(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching employee salary history: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Manager/Admin endpoint to view team salaries for a specific month
     */
    @GetMapping("/team")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<SalaryResponse>> getTeamSalaries(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        try {
            List<SalaryResponse> response = salaryService.getTeamSalaries(year, month);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching team salaries: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Manager/Admin endpoint to approve a salary
     */
    @PostMapping("/{salaryId}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<SalaryResponse> approveSalary(@PathVariable String salaryId) {
        try {
            String approvedBy = getCurrentUserId();
            SalaryResponse response = salaryService.approveSalary(salaryId, approvedBy);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error approving salary: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get current month salary (convenience endpoint)
     */
    @GetMapping("/my-salary/current")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<?> getCurrentMonthSalary() {
        try {
            YearMonth currentMonth = YearMonth.now();
            String userId = getCurrentUserId();
            SalaryResponse response = salaryService.getMySalary(
                    userId,
                    currentMonth.getYear(),
                    currentMonth.getMonthValue()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching current month salary: {}", e.getMessage(), e);
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage(), "message", e.getMessage()));
        }
    }

    private String getCurrentUserId() {
        return authenticationService.getCurrentUserId();
    }
}
