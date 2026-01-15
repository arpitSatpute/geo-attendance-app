package com.geoattendance.controller;

import com.geoattendance.dto.FaceVerificationRequest;
import com.geoattendance.dto.FaceVerificationResponse;
import com.geoattendance.entity.User;
import com.geoattendance.service.AuthenticationService;
import com.geoattendance.service.FaceVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * Face Verification Controller
 * Simple endpoints for face registration and daily verification
 */
@RestController
@RequestMapping("/face-verification")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class FaceVerificationController {
    
    private final FaceVerificationService faceVerificationService;
    private final AuthenticationService authenticationService;
    
    /**
     * Register user's face
     */
    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<FaceVerificationResponse> registerFace(
            @Valid @RequestBody FaceVerificationRequest request) {
        try {
            User user = authenticationService.getCurrentUser();
            log.info("Face registration request for user: {}", user.getId());
            
            if (request.getFaceImageData() == null || request.getFaceImageData().isEmpty()) {
                return ResponseEntity.badRequest().body(FaceVerificationResponse.builder()
                    .success(false)
                    .message("Face image data is required")
                    .faceRegistered(false)
                    .verifiedToday(false)
                    .build());
            }
            
            FaceVerificationResponse response = faceVerificationService.registerFace(
                user.getId(), 
                request.getFaceImageData()
            );
            
            return ResponseEntity.ok(response);
                
        } catch (Exception e) {
            log.error("Face registration failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(FaceVerificationResponse.builder()
                    .success(false)
                    .message("Face registration failed: " + e.getMessage())
                    .faceRegistered(false)
                    .verifiedToday(false)
                    .build());
        }
    }
    
    /**
     * Get registration status
     */
    @GetMapping("/registration-status")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<FaceVerificationResponse> getRegistrationStatus() {
        try {
            User user = authenticationService.getCurrentUser();
            FaceVerificationResponse response = faceVerificationService.getRegistrationStatus(user.getId());
            return ResponseEntity.ok(response);
                
        } catch (Exception e) {
            log.error("Failed to get registration status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(FaceVerificationResponse.builder()
                    .success(false)
                    .message("Failed to get registration status")
                    .faceRegistered(false)
                    .verifiedToday(false)
                    .build());
        }
    }
    
    /**
     * Verify face for daily attendance
     */
    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<FaceVerificationResponse> verifyFace(
            @Valid @RequestBody FaceVerificationRequest request) {
        try {
            User user = authenticationService.getCurrentUser();
            log.info("Face verification request for user: {}", user.getId());
            
            FaceVerificationResponse response = faceVerificationService.verifyFace(
                user.getId(), 
                request.getFaceImageData(),
                request.getConfidence()
            );
            
            return ResponseEntity.ok(response);
                
        } catch (Exception e) {
            log.error("Face verification failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(FaceVerificationResponse.builder()
                    .success(false)
                    .message("Face verification failed: " + e.getMessage())
                    .faceRegistered(false)
                    .verifiedToday(false)
                    .build());
        }
    }
    
    /**
     * Check if face verification is required today
     */
    @GetMapping("/required")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<FaceVerificationResponse> isVerificationRequired() {
        try {
            User user = authenticationService.getCurrentUser();
            FaceVerificationResponse response = faceVerificationService.checkVerificationStatus(user.getId());
            return ResponseEntity.ok(response);
                
        } catch (Exception e) {
            log.error("Failed to check verification status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(FaceVerificationResponse.builder()
                    .success(false)
                    .message("Failed to check verification status")
                    .faceRegistered(false)
                    .verifiedToday(false)
                    .build());
        }
    }
    
    /**
     * Get current verification status
     */
    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<FaceVerificationResponse> getStatus() {
        try {
            User user = authenticationService.getCurrentUser();
            FaceVerificationResponse response = faceVerificationService.checkVerificationStatus(user.getId());
            return ResponseEntity.ok(response);
                
        } catch (Exception e) {
            log.error("Failed to get status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(FaceVerificationResponse.builder()
                    .success(false)
                    .message("Failed to get status")
                    .faceRegistered(false)
                    .verifiedToday(false)
                    .build());
        }
    }
    
    /**
     * Admin: Reset face registration for a user
     */
    @PostMapping("/admin/reset/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FaceVerificationResponse> resetFaceRegistration(
            @PathVariable String userId) {
        try {
            FaceVerificationResponse response = faceVerificationService.resetFaceRegistration(userId);
            return ResponseEntity.ok(response);
                
        } catch (Exception e) {
            log.error("Failed to reset face registration: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(FaceVerificationResponse.builder()
                    .success(false)
                    .message("Failed to reset face registration")
                    .faceRegistered(false)
                    .verifiedToday(false)
                    .build());
        }
    }
}
