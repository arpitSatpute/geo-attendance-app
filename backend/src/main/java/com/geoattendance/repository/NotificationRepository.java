package com.geoattendance.repository;

import com.geoattendance.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByTimestampDesc(String userId);
    List<Notification> findByUserIdAndIsReadOrderByTimestampDesc(String userId, boolean isRead);
    long countByUserIdAndIsRead(String userId, boolean isRead);
}
