package com.geoattendance.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import java.time.LocalDateTime;

@Document(collection = "attendance_records")
@CompoundIndexes({
    @CompoundIndex(name = "user_check_in", def = "{'userId': 1, 'checkInTime': 1}"),
    @CompoundIndex(name = "user_status", def = "{'userId': 1, 'status': 1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    private String geofenceId;
    
    @Indexed
    private LocalDateTime checkInTime;
    
    private LocalDateTime checkOutTime;
    
    private Double checkInLatitude;
    
    private Double checkInLongitude;
    
    private Double checkOutLatitude;
    
    private Double checkOutLongitude;
    
    private Float locationAccuracyMeters;
    
    private String deviceInfo;
    
    private String networkType;
    
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.CHECKED_IN;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    public enum AttendanceStatus {
        CHECKED_IN, CHECKED_OUT, ABSENT, LATE, EARLY_LEAVE
    }
}
