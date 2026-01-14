package com.geoattendance.dto;

import com.geoattendance.entity.Leave;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveResponse {
    private String id;
    private String userId;
    private String userEmail;
    private String userName;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private String status;
    private String approvedById;
    private LocalDateTime approvalDate;
    private LocalDateTime createdAt;
    
    public static LeaveResponse fromEntity(Leave leave, String userEmail, String userName) {
        return LeaveResponse.builder()
                .id(leave.getId())
                .userId(leave.getUserId())
                .userEmail(userEmail)
                .userName(userName)
                .leaveType(leave.getLeaveType().name())
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .reason(leave.getReason())
                .status(leave.getStatus().name())
                .approvedById(leave.getApprovedById())
                .approvalDate(leave.getApprovalDate())
                .createdAt(leave.getCreatedAt())
                .build();
    }
}
