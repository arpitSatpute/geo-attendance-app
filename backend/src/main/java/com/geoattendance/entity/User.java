package com.geoattendance.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String email;
    
    private String password;
    
    private String firstName;
    
    private String lastName;
    
    private String phone;
    
    @Builder.Default
    private String role = "EMPLOYEE";
    
    private String department;
    
    @DBRef
    private User manager;
    
    private String managerId;
    
    @Builder.Default
    private boolean active = true;
    
    // Team assignment
    private String teamId;
    
    // Face registration data (base64 encoded face image reference)
    private String faceImageData;
    
    // Face descriptor for face comparison (comma-separated float values)
    private String faceDescriptor;
    
    private LocalDateTime faceRegisteredAt;
    
    @Builder.Default
    private boolean faceRegistered = false;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
