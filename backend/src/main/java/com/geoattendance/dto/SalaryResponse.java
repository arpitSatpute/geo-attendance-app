package com.geoattendance.dto;

import com.geoattendance.entity.Salary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.YearMonth;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryResponse {
    private String id;
    private String userId;
    private String userEmail;
    private String userName;
    private YearMonth month;
    private Double baseSalary;
    private Integer totalWorkingDays;
    private Integer presentDays;
    private Integer absentDays;
    private Integer lateDays;
    private Integer onTimeDays;
    private Double earnedSalary;
    private Double deductions;
    private Double performanceBonus;
    private Double overtimeBonus;
    private Double totalBonus;
    private Double netSalary;
    private Double onTimePercentage;
    private String status;
    private String calculatedBy;
    private LocalDateTime calculatedAt;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String remarks;
    
    public static SalaryResponse fromEntity(Salary salary) {
        return SalaryResponse.builder()
                .id(salary.getId())
                .userId(salary.getUserId())
                .userEmail(salary.getUserEmail())
                .userName(salary.getUserName())
                .month(salary.getMonth())
                .baseSalary(salary.getBaseSalary())
                .totalWorkingDays(salary.getTotalWorkingDays())
                .presentDays(salary.getPresentDays())
                .absentDays(salary.getAbsentDays())
                .lateDays(salary.getLateDays())
                .onTimeDays(salary.getOnTimeDays())
                .earnedSalary(salary.getEarnedSalary())
                .deductions(salary.getDeductions())
                .performanceBonus(salary.getPerformanceBonus())
                .overtimeBonus(salary.getOvertimeBonus())
                .totalBonus(salary.getTotalBonus())
                .netSalary(salary.getNetSalary())
                .onTimePercentage(salary.getOnTimePercentage())
                .status(salary.getStatus().name())
                .calculatedBy(salary.getCalculatedBy())
                .calculatedAt(salary.getCalculatedAt())
                .approvedBy(salary.getApprovedBy())
                .approvedAt(salary.getApprovedAt())
                .remarks(salary.getRemarks())
                .build();
    }
}
