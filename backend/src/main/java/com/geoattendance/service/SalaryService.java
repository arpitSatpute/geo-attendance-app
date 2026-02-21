package com.geoattendance.service;

import com.geoattendance.entity.AttendanceRecord;
import com.geoattendance.entity.Salary;
import com.geoattendance.entity.User;
import com.geoattendance.repository.AttendanceRepository;
import com.geoattendance.repository.SalaryRepository;
import com.geoattendance.repository.UserRepository;
import com.geoattendance.dto.SalaryCalculationRequest;
import com.geoattendance.dto.SalaryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SalaryService {

    private static final Logger log = LoggerFactory.getLogger(SalaryService.class);
    private static final LocalTime STANDARD_CHECK_IN_TIME = LocalTime.of(9, 0);
    private static final int LATE_TOLERANCE_MINUTES = 15;
    private static final double ON_TIME_95_BONUS_PERCENT = 0.10; // 10% bonus
    private static final double ON_TIME_90_BONUS_PERCENT = 0.05; // 5% bonus
    private static final double DEFAULT_BASE_SALARY = 50000.0; // Default if not set

    private final SalaryRepository salaryRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public SalaryService(SalaryRepository salaryRepository,
                         AttendanceRepository attendanceRepository,
                         UserRepository userRepository,
                         NotificationService notificationService) {
        this.salaryRepository = salaryRepository;
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public SalaryResponse calculateMonthlySalary(SalaryCalculationRequest request, String calculatedBy) {
        log.info("Calculating salary for user: {} for month: {}/{}", request.getUserId(), request.getYear(), request.getMonth());
        
        // Validate and fetch user
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        YearMonth yearMonth = YearMonth.of(request.getYear(), request.getMonth());
        String monthStr = yearMonth.toString();  // Format: "2026-01"
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        
        // Fetch attendance records
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
        
        List<AttendanceRecord> attendances = attendanceRepository
                .findByUserIdAndCheckInTimeBetween(request.getUserId(), startDateTime, endDateTime);
        
        // Calculate working days (excluding weekends)
        int totalWorkingDays = calculateWorkingDays(startDate, endDate);
        
        // Count present days
        int presentDays = (int) attendances.stream()
                .filter(a -> a.getCheckInTime() != null)
                .map(a -> a.getCheckInTime().toLocalDate())
                .distinct()
                .count();
        
        int absentDays = totalWorkingDays - presentDays;
        
        // Count late and on-time days
        long lateDays = attendances.stream()
                .filter(this::isLate)
                .count();
        
        long onTimeDays = attendances.stream()
                .filter(this::isOnTime)
                .count();
        
        // Get base salary (from user or default)
        double baseSalary = user.getBaseSalary() != null ? user.getBaseSalary() : DEFAULT_BASE_SALARY;
        double perDaySalary = baseSalary / totalWorkingDays;
        
        // Calculate earned salary
        double earnedSalary = perDaySalary * presentDays;
        double deduction = perDaySalary * absentDays;
        
        // Calculate bonuses
        double performanceBonus = calculatePerformanceBonus(attendances, (int) onTimeDays, baseSalary);
        double overtimeBonus = 0.0; // Can be implemented based on overtime hours
        double totalBonus = performanceBonus + overtimeBonus;
        
        // Calculate net salary
        double netSalary = earnedSalary + totalBonus;
        
        // Calculate on-time percentage
        double onTimePercentage = presentDays > 0 ? ((double) onTimeDays / presentDays) * 100 : 0.0;
        
        // Check if salary already exists
        Salary salary = salaryRepository.findByUserIdAndMonth(request.getUserId(), monthStr)
                .orElse(Salary.builder()
                        .userId(user.getId())
                        .userEmail(user.getEmail())
                        .userName(user.getFirstName() + " " + user.getLastName())
                        .month(monthStr)
                        .build());
        
        // Update salary details
        salary.setBaseSalary(baseSalary);
        salary.setTotalWorkingDays(totalWorkingDays);
        salary.setPresentDays(presentDays);
        salary.setAbsentDays(absentDays);
        salary.setLateDays((int) lateDays);
        salary.setOnTimeDays((int) onTimeDays);
        salary.setEarnedSalary(earnedSalary);
        salary.setDeductions(deduction);
        salary.setPerformanceBonus(performanceBonus);
        salary.setOvertimeBonus(overtimeBonus);
        salary.setTotalBonus(totalBonus);
        salary.setNetSalary(netSalary);
        salary.setOnTimePercentage(onTimePercentage);
        salary.setStatus(Salary.SalaryStatus.CALCULATED);
        salary.setCalculatedBy(calculatedBy);
        salary.setCalculatedAt(LocalDateTime.now());
        salary.setRemarks(request.getRemarks());
        
        salary = salaryRepository.save(salary);
        
        notificationService.sendSalaryUpdateNotification(user, monthStr, netSalary, false);
        
        log.info("Salary calculated successfully for user: {} - Net Salary: {}", user.getEmail(), netSalary);
        
        return SalaryResponse.fromEntity(salary);
    }

    public SalaryResponse getMySalary(String userId, Integer year, Integer month) {
        String monthStr = String.format("%d-%02d", year, month);  // Format: "2026-01"
        Salary salary = salaryRepository.findByUserIdAndMonth(userId, monthStr)
                .orElseThrow(() -> new RuntimeException("Salary not calculated for this month"));
        
        return SalaryResponse.fromEntity(salary);
    }

    public List<SalaryResponse> getMySalaryHistory(String userId) {
        List<Salary> salaries = salaryRepository.findByUserIdOrderByMonthDesc(userId);
        return salaries.stream()
                .map(SalaryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SalaryResponse> getTeamSalaries(Integer year, Integer month) {
        String monthStr = String.format("%d-%02d", year, month);  // Format: "2026-01"
        List<Salary> salaries = salaryRepository.findByMonth(monthStr);
        return salaries.stream()
                .map(SalaryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public SalaryResponse approveSalary(String salaryId, String approvedBy) {
        Salary salary = salaryRepository.findById(salaryId)
                .orElseThrow(() -> new RuntimeException("Salary not found"));
        
        salary.setStatus(Salary.SalaryStatus.APPROVED);
        salary.setApprovedBy(approvedBy);
        salary.setApprovedAt(LocalDateTime.now());
        
        salary = salaryRepository.save(salary);
        
        User user = userRepository.findById(salary.getUserId()).orElse(null);
        if (user != null) {
            notificationService.sendSalaryUpdateNotification(user, salary.getMonth(), salary.getNetSalary(), true);
        }
        
        log.info("Salary approved for user: {} by: {}", salary.getUserEmail(), approvedBy);
        
        return SalaryResponse.fromEntity(salary);
    }

    private double calculatePerformanceBonus(List<AttendanceRecord> attendances, int onTimeDays, double baseSalary) {
        if (attendances.isEmpty()) {
            return 0.0;
        }
        
        double onTimePercentage = (double) onTimeDays / attendances.size();
        
        if (onTimePercentage >= 0.95) {
            return baseSalary * ON_TIME_95_BONUS_PERCENT;
        } else if (onTimePercentage >= 0.90) {
            return baseSalary * ON_TIME_90_BONUS_PERCENT;
        }
        return 0.0;
    }

    private boolean isOnTime(AttendanceRecord attendance) {
        if (attendance.getCheckInTime() == null) {
            return false;
        }
        LocalTime checkIn = attendance.getCheckInTime().toLocalTime();
        return !checkIn.isAfter(STANDARD_CHECK_IN_TIME.plusMinutes(LATE_TOLERANCE_MINUTES));
    }

    private boolean isLate(AttendanceRecord attendance) {
        if (attendance.getCheckInTime() == null) {
            return false;
        }
        LocalTime checkIn = attendance.getCheckInTime().toLocalTime();
        return checkIn.isAfter(STANDARD_CHECK_IN_TIME.plusMinutes(LATE_TOLERANCE_MINUTES));
    }

    private int calculateWorkingDays(LocalDate start, LocalDate end) {
        int workingDays = 0;
        LocalDate current = start;
        
        while (!current.isAfter(end)) {
            DayOfWeek day = current.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                workingDays++;
            }
            current = current.plusDays(1);
        }
        
        return workingDays;
    }
}
