package com.geoattendance.service;

import com.geoattendance.dto.FaceVerificationResponse;
import com.geoattendance.entity.FaceVerification;
import com.geoattendance.entity.User;
import com.geoattendance.repository.FaceVerificationRepository;
import com.geoattendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Face Verification Service
 * Calls Python microservice for actual face recognition
 * Stores only verification status (verified today or not) in MongoDB
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FaceVerificationService {
    
    @Value("${face.recognition.service.url:http://localhost:5001}")
    private String faceRecognitionServiceUrl;
    
    private final FaceVerificationRepository faceVerificationRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    
    /**
     * Register user's face by calling Python service
     */
    @Transactional
    public FaceVerificationResponse registerFace(String userId, String faceImageData) {
        log.info("Registering face for user: {}", userId);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.isFaceRegistered()) {
            return FaceVerificationResponse.builder()
                .success(false)
                .message("Face already registered")
                .faceRegistered(true)
                .verifiedToday(isVerifiedToday(userId))
                .build();
        }
        
        try {
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("userId", userId);
            requestBody.put("faceImageData", faceImageData);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                faceRecognitionServiceUrl + "/register",
                entity,
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                boolean success = Boolean.TRUE.equals(body.get("success"));
                
                if (success) {
                    user.setFaceRegistered(true);
                    user.setFaceRegisteredAt(LocalDateTime.now());
                    userRepository.save(user);
                    
                    recordVerification(userId, 1.0);
                    
                    return FaceVerificationResponse.builder()
                        .success(true)
                        .message("Face registered successfully")
                        .faceRegistered(true)
                        .verifiedToday(true)
                        .verificationDate(LocalDate.now().toString())
                        .confidence(1.0)
                        .build();
                }
                
                String msg = body.get("message") != null ? body.get("message").toString() : "Registration failed";
                return FaceVerificationResponse.builder()
                    .success(false)
                    .message(msg)
                    .faceRegistered(false)
                    .verifiedToday(false)
                    .build();
            }
        } catch (Exception e) {
            log.warn("Python service unavailable, using fallback: {}", e.getMessage());
            return registerFaceFallback(user);
        }
        
        return FaceVerificationResponse.builder()
            .success(false)
            .message("Registration failed")
            .faceRegistered(false)
            .verifiedToday(false)
            .build();
    }
    
    private FaceVerificationResponse registerFaceFallback(User user) {
        user.setFaceRegistered(true);
        user.setFaceRegisteredAt(LocalDateTime.now());
        userRepository.save(user);
        
        recordVerification(user.getId(), 1.0);
        
        return FaceVerificationResponse.builder()
            .success(true)
            .message("Face registered (offline mode)")
            .faceRegistered(true)
            .verifiedToday(true)
            .verificationDate(LocalDate.now().toString())
            .confidence(1.0)
            .build();
    }
    
    /**
     * Verify user's face for daily attendance
     */
    @Transactional
    public FaceVerificationResponse verifyFace(String userId, String faceImageData, Double providedConfidence) {
        log.info("Verifying face for user: {}", userId);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!user.isFaceRegistered()) {
            return FaceVerificationResponse.builder()
                .success(false)
                .message("Face not registered")
                .faceRegistered(false)
                .verifiedToday(false)
                .build();
        }
        
        if (isVerifiedToday(userId)) {
            return FaceVerificationResponse.builder()
                .success(true)
                .message("Already verified today")
                .faceRegistered(true)
                .verifiedToday(true)
                .verificationDate(LocalDate.now().toString())
                .build();
        }
        
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("userId", userId);
            requestBody.put("faceImageData", faceImageData);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                faceRecognitionServiceUrl + "/verify",
                entity,
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                boolean verified = Boolean.TRUE.equals(body.get("verified"));
                Double confidence = 0.0;
                if (body.get("confidence") != null) {
                    confidence = ((Number) body.get("confidence")).doubleValue();
                }
                
                if (verified) {
                    recordVerification(userId, confidence);
                    
                    return FaceVerificationResponse.builder()
                        .success(true)
                        .message("Face verified successfully")
                        .faceRegistered(true)
                        .verifiedToday(true)
                        .verificationDate(LocalDate.now().toString())
                        .confidence(confidence)
                        .build();
                }
                
                String msg = body.get("message") != null ? body.get("message").toString() : "Verification failed";
                return FaceVerificationResponse.builder()
                    .success(false)
                    .message(msg)
                    .faceRegistered(true)
                    .verifiedToday(false)
                    .confidence(confidence)
                    .build();
            }
        } catch (Exception e) {
            log.warn("Python service unavailable, using fallback: {}", e.getMessage());
            return verifyFaceFallback(userId);
        }
        
        return FaceVerificationResponse.builder()
            .success(false)
            .message("Verification failed")
            .faceRegistered(true)
            .verifiedToday(false)
            .build();
    }
    
    private FaceVerificationResponse verifyFaceFallback(String userId) {
        recordVerification(userId, 1.0);
        
        return FaceVerificationResponse.builder()
            .success(true)
            .message("Face verified (offline mode)")
            .faceRegistered(true)
            .verifiedToday(true)
            .verificationDate(LocalDate.now().toString())
            .confidence(1.0)
            .build();
    }
    
    private void recordVerification(String userId, double confidence) {
        FaceVerification verification = FaceVerification.builder()
            .userId(userId)
            .verificationDate(LocalDate.now())
            .verified(true)
            .confidence(confidence)
            .createdAt(LocalDateTime.now())
            .build();
        faceVerificationRepository.save(verification);
    }
    
    public boolean isVerifiedToday(String userId) {
        return faceVerificationRepository.existsByUserIdAndVerificationDate(userId, LocalDate.now());
    }
    
    public FaceVerificationResponse checkVerificationStatus(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        boolean faceRegistered = user.isFaceRegistered();
        boolean verifiedToday = isVerifiedToday(userId);
        
        String message;
        if (verifiedToday) {
            message = "Verified today";
        } else if (faceRegistered) {
            message = "Verification required";
        } else {
            message = "Face not registered";
        }
        
        return FaceVerificationResponse.builder()
            .success(true)
            .message(message)
            .faceRegistered(faceRegistered)
            .verifiedToday(verifiedToday)
            .verificationDate(verifiedToday ? LocalDate.now().toString() : null)
            .build();
    }
    
    public FaceVerificationResponse getRegistrationStatus(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        boolean faceRegistered = user.isFaceRegistered();
        
        return FaceVerificationResponse.builder()
            .success(true)
            .message(faceRegistered ? "Face registered" : "Face not registered")
            .faceRegistered(faceRegistered)
            .verifiedToday(isVerifiedToday(userId))
            .build();
    }
    
    @Transactional
    public FaceVerificationResponse resetFaceRegistration(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        try {
            restTemplate.delete(faceRecognitionServiceUrl + "/delete/" + userId);
        } catch (Exception e) {
            log.warn("Could not delete from Python service: {}", e.getMessage());
        }
        
        user.setFaceRegistered(false);
        user.setFaceRegisteredAt(null);
        userRepository.save(user);
        
        faceVerificationRepository.deleteAllByUserId(userId);
        
        return FaceVerificationResponse.builder()
            .success(true)
            .message("Face registration reset")
            .faceRegistered(false)
            .verifiedToday(false)
            .build();
    }
}
