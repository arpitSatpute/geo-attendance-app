package com.geoattendance.service;

import com.geoattendance.entity.Leave;
import com.geoattendance.entity.User;
import com.geoattendance.repository.LeaveRepository;
import com.geoattendance.repository.UserRepository;
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

    public LeaveService(LeaveRepository leaveRepository, UserRepository userRepository) {
        this.leaveRepository = leaveRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public LeaveResponse applyLeave(String userId, LeaveRequest request) {
        log.info("User {} applying for leave from {} to {}", userId, request.getStartDate(), request.getEndDate());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Leave leave = Leave.builder()
                .userId(userId)
                .leaveType(Leave.LeaveType.valueOf(request.getLeaveType().toUpperCase()))
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(request.getReason())
                .status(Leave.LeaveStatus.PENDING)
                .build();
        
        leave = leaveRepository.save(leave);
        
        log.info("Leave application created with ID: {}", leave.getId());
        
        return LeaveResponse.fromEntity(leave, user.getEmail(), user.getFirstName() + " " + user.getLastName());
    }

    public List<LeaveResponse> getMyLeaves(String userId) {
        List<Leave> leaves = leaveRepository.findByUserId(userId);
        User user = userRepository.findById(userId).orElse(null);
        String email = user != null ? user.getEmail() : "";
        String name = user != null ? user.getFirstName() + " " + user.getLastName() : "";
        
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
        String email = user != null ? user.getEmail() : "";
        String name = user != null ? user.getFirstName() + " " + user.getLastName() : "";
        
        log.info("Leave {} rejected by {}", leaveId, approvedById);
        
        return LeaveResponse.fromEntity(leave, email, name);
    }
}
