package com.geoattendance.repository;

import com.geoattendance.entity.Geofence;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GeofenceRepository extends MongoRepository<Geofence, String> {
    
    List<Geofence> findByIsActiveTrue();
    
    List<Geofence> findByCreatedById(String userId);

    List<Geofence> findByCreatedByIdAndIsActiveTrue(String userId);
}
