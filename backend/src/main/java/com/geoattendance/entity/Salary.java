package com.geoattendance.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import java.time.LocalDateTime;
import java.time.YearMonth;

@Document(collection = "salaries")
@CompoundIndexes({
    @CompoundIndex(name = "user_month", def = "{'userId': 1, 'month': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Salary {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    private String userEmail;
    
    private String userName;
    
    @Indexed
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
    
    @Builder.Default
    private SalaryStatus status = SalaryStatus.DRAFT;
    
    private String calculatedBy;
    
    private LocalDateTime calculatedAt;
    
    private String approvedBy;
    
    private LocalDateTime approvedAt;
    
    private String remarks;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    public enum SalaryStatus {
        DRAFT, CALCULATED, APPROVED, PAID
    }
}
