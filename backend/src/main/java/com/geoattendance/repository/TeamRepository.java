package com.geoattendance.repository;

import com.geoattendance.entity.Team;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TeamRepository extends MongoRepository<Team, String> {
    List<Team> findByManagerId(String managerId);
    List<Team> findByEmployeeIdsContains(String employeeId);
}
