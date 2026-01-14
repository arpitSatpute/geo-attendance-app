package com.geoattendance.repository;

import com.geoattendance.entity.Salary;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRepository extends MongoRepository<Salary, String> {
    
    Optional<Salary> findByUserIdAndMonth(String userId, YearMonth month);
    
    List<Salary> findByUserId(String userId);
    
    List<Salary> findByMonth(YearMonth month);
    
    List<Salary> findByStatus(Salary.SalaryStatus status);
    
    List<Salary> findByUserIdOrderByMonthDesc(String userId);
}
