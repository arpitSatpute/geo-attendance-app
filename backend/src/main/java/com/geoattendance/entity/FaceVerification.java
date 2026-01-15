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

@Document(collection = "face_verifications")
@CompoundIndexes({
    @CompoundIndex(name = "user_date", def = "{'userId': 1, 'verificationDate': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceVerification {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    // Store face template/encoding for comparison (in production, use proper face encoding)
    private String faceTemplate;
    
    // Daily verification tracking
    private LocalDate verificationDate;
    
    @Builder.Default
    private boolean verified = false;
    
    private Double confidence;
    
    // Track verification attempts
    @Builder.Default
    private int attempts = 0;
    
    // Track failed attempts
    private LocalDateTime lastFailedAt;
    
    private String lastFailureReason;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
