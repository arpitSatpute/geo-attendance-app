package com.geoattendance.repository;

import com.geoattendance.entity.AttendanceRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends MongoRepository<AttendanceRecord, String> {
    
    List<AttendanceRecord> findByUserIdAndCheckInTimeBetween(
        String userId, LocalDateTime startTime, LocalDateTime endTime
    );
    
    List<AttendanceRecord> findByUserIdInAndCheckInTimeBetween(
        List<String> userIds, LocalDateTime startTime, LocalDateTime endTime
    );
    
    @Query(value = "{ 'userId': ?0 }", sort = "{ 'checkInTime': -1 }")
    Optional<AttendanceRecord> findFirstByUserIdOrderByCheckInTimeDesc(String userId);
    
    List<AttendanceRecord> findByCheckOutTimeIsNull();
    
    List<AttendanceRecord> findByCheckInTimeBetween(LocalDateTime start, LocalDateTime end);
    
    long countByUserIdAndCheckOutTimeIsNotNull(String userId);
    
    List<AttendanceRecord> findByGeofenceId(String geofenceId);
    
    List<AttendanceRecord> findByUserId(String userId);
}
