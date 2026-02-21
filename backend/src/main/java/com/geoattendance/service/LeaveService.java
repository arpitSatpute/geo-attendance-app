package com.geoattendance.service;

import com.geoattendance.entity.Leave;
import com.geoattendance.entity.User;
import com.geoattendance.repository.LeaveRepository;
import com.geoattendance.repository.UserRepository;
import com.geoattendance.repository.TeamRepository;
import com.geoattendance.entity.Team;
import com.geoattendance.dto.LeaveRequest;
import com.geoattendance.dto.LeaveResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    private static final Logger log = LoggerFactory.getLogger(LeaveService.class);

    private final LeaveRepository leaveRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final NotificationService notificationService;

    public LeaveService(LeaveRepository leaveRepository, UserRepository userRepository, 
                        TeamRepository teamRepository, NotificationService notificationService) {
        this.leaveRepository = leaveRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public LeaveResponse applyLeave(String userId, LeaveRequest request) {
        log.info("User {} applying for leave from {} to {}", userId, request.getStartDate(), request.getEndDate());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        Leave leave = Leave.builder()
                .userId(user.getId())
                .leaveType(Leave.LeaveType.valueOf(request.getLeaveType().toUpperCase()))
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(request.getReason())
                .status(Leave.LeaveStatus.PENDING)
                .build();
        
        leave = leaveRepository.save(leave);
        
        log.info("Leave application created with ID: {}", leave.getId());

        // Notify manager
        String managerId = user.getManagerId();
        if (managerId == null && user.getManager() != null) {
            managerId = user.getManager().getId();
        }
        
        // If still null, try finding via team
        if (managerId == null) {
            List<Team> teams = teamRepository.findByEmployeeIdsContains(userId);
            if (!teams.isEmpty()) {
                managerId = teams.get(0).getManagerId();
            }
        }

        if (managerId != null) {
            log.info("Notifying manager with ID {} about leave request from {}", managerId, userId);
            String message = String.format("%s applied for %s leave (%s to %s)", 
                user.getFirstName() + " " + user.getLastName(), 
                leave.getLeaveType(), leave.getStartDate(), leave.getEndDate());
            notificationService.sendNotification(managerId, "LEAVE_REQUEST", "New Leave Request", message);
            
            // Also send email to manager if possible
            if (user.getManager() != null) {
                notificationService.sendEmailNotification(user.getManager().getEmail(), "New Leave Request", message);
            } else {
                userRepository.findById(managerId).ifPresent(m -> 
                    notificationService.sendEmailNotification(m.getEmail(), "New Leave Request", message)
                );
            }
        } else {
            log.warn("No manager found to notify for user {}", userId);
        }
        
        return LeaveResponse.fromEntity(leave, user.getEmail(), user.getFirstName() + " " + user.getLastName());
    }

    public List<LeaveResponse> getMyLeaves(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return List.of();
        }
        List<Leave> leaves = leaveRepository.findByUserId(user.getId());
        String email = user.getEmail();
        String name = user.getFirstName() + " " + user.getLastName();
        
        return leaves.stream()
                .map(leave -> LeaveResponse.fromEntity(leave, email, name))
                .collect(Collectors.toList());
    }

    public List<LeaveResponse> getPendingLeaves() {
        List<Leave> leaves = leaveRepository.findByStatus(Leave.LeaveStatus.PENDING);
        
        return leaves.stream()
                .map(leave -> {
                    User user = userRepository.findById(leave.getUserId()).orElse(null);
                    String email = user != null ? user.getEmail() : "";
                    String name = user != null ? user.getFirstName() + " " + user.getLastName() : "";
                    return LeaveResponse.fromEntity(leave, email, name);
                })
                .collect(Collectors.toList());
    }

    public List<LeaveResponse> getAllLeaves() {
        List<Leave> leaves = leaveRepository.findAll();
        
        return leaves.stream()
                .map(leave -> {
                    User user = userRepository.findById(leave.getUserId()).orElse(null);
                    String email = user != null ? user.getEmail() : "";
                    String name = user != null ? user.getFirstName() + " " + user.getLastName() : "";
                    return LeaveResponse.fromEntity(leave, email, name);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public LeaveResponse approveLeave(String leaveId, String approvedById) {
        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found"));
        
        leave.setStatus(Leave.LeaveStatus.APPROVED);
        leave.setApprovedById(approvedById);
        leave.setApprovalDate(LocalDateTime.now());
        
        leave = leaveRepository.save(leave);
        
        User user = userRepository.findById(leave.getUserId()).orElse(null);
        if (user != null) {
            notificationService.sendLeaveApprovalNotification(user, true);
        }
        String email = user != null ? user.getEmail() : "";
        String name = user != null ? user.getFirstName() + " " + user.getLastName() : "";
        
        log.info("Leave {} approved by {}", leaveId, approvedById);
        
        return LeaveResponse.fromEntity(leave, email, name);
    }

    @Transactional
    public LeaveResponse rejectLeave(String leaveId, String approvedById) {
        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found"));
        
        leave.setStatus(Leave.LeaveStatus.REJECTED);
        leave.setApprovedById(approvedById);
        leave.setApprovalDate(LocalDateTime.now());
        
        leave = leaveRepository.save(leave);
        
        User user = userRepository.findById(leave.getUserId()).orElse(null);
        if (user != null) {
            notificationService.sendLeaveApprovalNotification(user, false);
        }
        String email = user != null ? user.getEmail() : "";
        String name = user != null ? user.getFirstName() + " " + user.getLastName() : "";
        
        log.info("Leave {} rejected by {}", leaveId, approvedById);
        
        return LeaveResponse.fromEntity(leave, email, name);
    }
}
