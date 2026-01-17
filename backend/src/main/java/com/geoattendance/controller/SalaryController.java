package com.geoattendance.controller;

import com.geoattendance.dto.SalaryCalculationRequest;
import com.geoattendance.dto.SalaryResponse;
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

@RestController
@RequestMapping("/salary")
public class SalaryController {

    private static final Logger log = LoggerFactory.getLogger(SalaryController.class);

    private final SalaryService salaryService;

    public SalaryController(SalaryService salaryService) {
        this.salaryService = salaryService;
    }

    /**
     * Manager/Admin endpoint to calculate salary for an employee
     */
    @PostMapping("/calculate")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<SalaryResponse> calculateSalary(@RequestBody SalaryCalculationRequest request) {
        try {
            String calculatedBy = getCurrentUserId();
            SalaryResponse response = salaryService.calculateMonthlySalary(request, calculatedBy);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error calculating salary: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Employee endpoint to view their own salary for a specific month
     */
    @GetMapping("/my-salary")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<SalaryResponse> getMySalary(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        try {
            String userId = getCurrentUserId();
            SalaryResponse response = salaryService.getMySalary(userId, year, month);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching salary: {}", e.getMessage(), e);
            return ResponseEntity.notFound().build();
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
    public ResponseEntity<SalaryResponse> getCurrentMonthSalary() {
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
            return ResponseEntity.notFound().build();
        }
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName(); // Assumes principal is user ID
    }
}
