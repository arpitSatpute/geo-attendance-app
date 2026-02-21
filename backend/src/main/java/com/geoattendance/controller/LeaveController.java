package com.geoattendance.controller;

import com.geoattendance.dto.LeaveRequest;
import com.geoattendance.dto.LeaveResponse;
import com.geoattendance.dto.LeaveResponse;
import com.geoattendance.service.AuthenticationService;
import com.geoattendance.service.LeaveService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/leaves")
public class LeaveController {

    private static final Logger log = LoggerFactory.getLogger(LeaveController.class);

    private final LeaveService leaveService;
    private final AuthenticationService authenticationService;

    public LeaveController(LeaveService leaveService, AuthenticationService authenticationService) {
        this.leaveService = leaveService;
        this.authenticationService = authenticationService;
    }

    /**
     * Employee applies for leave
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<?> applyLeave(@RequestBody LeaveRequest request) {
        try {
            String userId = getCurrentUserId();
            log.info("User {} applying for leave: type={}, from={}, to={}", userId, request.getLeaveType(), request.getStartDate(), request.getEndDate());
            LeaveResponse response = leaveService.applyLeave(userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error applying for leave: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get my leave applications
     */
    @GetMapping("/my-leaves")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<LeaveResponse>> getMyLeaves() {
        try {
            String userId = getCurrentUserId();
            List<LeaveResponse> response = leaveService.getMyLeaves(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching leaves: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Manager/Admin gets leaves for a specific employee
     */
    @GetMapping("/employee/{userId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<LeaveResponse>> getEmployeeLeaves(@PathVariable String userId) {
        try {
            List<LeaveResponse> response = leaveService.getMyLeaves(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching employee leaves: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Manager/Admin gets all leaves (for approval)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<LeaveResponse>> getAllLeaves() {
        try {
            List<LeaveResponse> response = leaveService.getAllLeaves();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching all leaves: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Manager/Admin gets pending leaves
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<LeaveResponse>> getPendingLeaves() {
        try {
            List<LeaveResponse> response = leaveService.getPendingLeaves();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching pending leaves: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Manager/Admin approves a leave
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<LeaveResponse> approveLeave(@PathVariable String id) {
        try {
            String approvedById = getCurrentUserId();
            LeaveResponse response = leaveService.approveLeave(id, approvedById);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error approving leave: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Manager/Admin rejects a leave
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<LeaveResponse> rejectLeave(@PathVariable String id) {
        try {
            String approvedById = getCurrentUserId();
            LeaveResponse response = leaveService.rejectLeave(id, approvedById);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error rejecting leave: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    private String getCurrentUserId() {
        return authenticationService.getCurrentUserId();
    }
}
