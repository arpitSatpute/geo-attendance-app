package com.geoattendance.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "leaves")
@CompoundIndexes({
    @CompoundIndex(name = "user_status", def = "{'userId': 1, 'status': 1}"),
    @CompoundIndex(name = "date_range", def = "{'startDate': 1, 'endDate': 1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Leave {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    @Builder.Default
    private LeaveType leaveType = LeaveType.CASUAL;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private String reason;
    
    @Builder.Default
    private LeaveStatus status = LeaveStatus.PENDING;
    
    private String approvedById;
    
    private LocalDateTime approvalDate;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    public enum LeaveType {
        SICK, CASUAL, ANNUAL, UNPAID
    }
    
    public enum LeaveStatus {
        PENDING, APPROVED, REJECTED
    }
}
