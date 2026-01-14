package com.geoattendance.repository;

import com.geoattendance.entity.Leave;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRepository extends MongoRepository<Leave, String> {
    
    List<Leave> findByUserId(String userId);
    
    List<Leave> findByStatus(Leave.LeaveStatus status);
    
    List<Leave> findByUserIdAndStatus(String userId, Leave.LeaveStatus status);
    
    List<Leave> findByStartDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Leave> findByUserIdAndStartDateBetween(String userId, LocalDate startDate, LocalDate endDate);
}
