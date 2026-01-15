package com.geoattendance.repository;

import com.geoattendance.entity.FaceVerification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FaceVerificationRepository extends MongoRepository<FaceVerification, String> {
    
    Optional<FaceVerification> findByUserIdAndVerificationDate(String userId, LocalDate date);
    
    Optional<FaceVerification> findFirstByUserIdOrderByCreatedAtDesc(String userId);
    
    boolean existsByUserIdAndVerificationDate(String userId, LocalDate date);
    
    boolean existsByUserIdAndVerificationDateAndVerifiedTrue(String userId, LocalDate verificationDate);
    
    // Pagination support for verification history
    Page<FaceVerification> findByUserId(String userId, Pageable pageable);
    
    // Find all verifications for a date
    List<FaceVerification> findByVerificationDate(LocalDate verificationDate);
    
    // Find verified entries for a date
    List<FaceVerification> findByVerificationDateAndVerifiedTrue(LocalDate verificationDate);
    
    // Count verifications
    long countByVerificationDateAndVerifiedTrue(LocalDate verificationDate);
    
    long countByVerificationDate(LocalDate verificationDate);
    
    // Find by user and date range
    List<FaceVerification> findByUserIdAndVerificationDateBetween(
        String userId, LocalDate startDate, LocalDate endDate);
    
    // Delete all verifications for a user
    void deleteAllByUserId(String userId);
}
