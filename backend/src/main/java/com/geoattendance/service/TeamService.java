
package com.geoattendance.service;

import com.geoattendance.entity.Team;
import com.geoattendance.entity.User;
import com.geoattendance.repository.TeamRepository;
import com.geoattendance.repository.UserRepository;
import com.geoattendance.repository.GeofenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TeamService {
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final GeofenceRepository geofenceRepository;

    @Cacheable(value = "teams", key = "'manager:' + #managerId")
    public List<Team> getTeamsByManager(String managerId) {
        return teamRepository.findByManagerId(managerId);
    }

    @Cacheable(value = "teams", key = "#teamId")
    public Optional<Team> getTeamById(String teamId) {
        return teamRepository.findById(teamId);
    }

    @Transactional
    @CacheEvict(value = "teams", allEntries = true)
    public Team createTeam(String name, String managerId) {
        Team team = Team.builder()
                .name(name)
                .managerId(managerId)
                .build();
        return teamRepository.save(team);
    }

    public List<com.geoattendance.entity.Geofence> getAvailableGeofencesForTeam(String teamId) {
        // Optionally, filter by manager or return all geofences
        // For now, return all active geofences
        return geofenceRepository.findByIsActiveTrue();
    }


    @Transactional
    @CacheEvict(value = "teams", allEntries = true)
    public Team addEmployeeToTeamByEmail(String teamId, String employeeEmail) {
        Team team = teamRepository.findById(teamId).orElseThrow();
        User employee = userRepository.findByEmail(employeeEmail)
            .orElseThrow(() -> new RuntimeException("Employee not found with email: " + employeeEmail));
        if (!"EMPLOYEE".equalsIgnoreCase(employee.getRole())) {
            throw new RuntimeException("User is not an employee");
        }
        if (team.getEmployeeIds() == null) {
            team.setEmployeeIds(new java.util.ArrayList<>());
        }
        if (!team.getEmployeeIds().contains(employee.getId())) {
            team.getEmployeeIds().add(employee.getId());
            teamRepository.save(team);
            
            // Link user to team and manager
            employee.setTeamId(teamId);
            employee.setManagerId(team.getManagerId());
            userRepository.save(employee);
        }
        return team;
    }

    @Transactional
    @CacheEvict(value = "teams", allEntries = true)
    public Team setGeofenceForTeam(String teamId, String geofenceId) {
        Team team = teamRepository.findById(teamId).orElseThrow();
        team.setGeofenceId(geofenceId);
        return teamRepository.save(team);
    }

    @Transactional
    @CacheEvict(value = "teams", allEntries = true)
    public Team removeEmployeeFromTeam(String teamId, String employeeId) {
        Team team = teamRepository.findById(teamId).orElseThrow();
        if (team.getEmployeeIds() != null && team.getEmployeeIds().contains(employeeId)) {
            team.getEmployeeIds().remove(employeeId);
            teamRepository.save(team);
        }
        return team;
    }
    public List<User> getEmployeesOfTeam(String teamId) {
        Team team = teamRepository.findById(teamId).orElseThrow();
        if (team.getEmployeeIds() == null || team.getEmployeeIds().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return userRepository.findAllById(team.getEmployeeIds());
    }

    public Optional<Team> getTeamByEmployeeId(String employeeId) {
        List<Team> teams = teamRepository.findByEmployeeIdsContains(employeeId);
        if (teams != null && !teams.isEmpty()) {
            return Optional.of(teams.get(0)); // Return first team if employee is in multiple teams
        }
        return Optional.empty();
    }

    @Transactional
    @CacheEvict(value = "teams", allEntries = true)
    public Team setWorkHours(String teamId, LocalTime workStartTime, LocalTime workEndTime,
                             LocalTime checkInDeadline, LocalTime checkOutAllowedFrom,
                             Integer checkInBufferMinutes, Integer checkOutBufferMinutes) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found: " + teamId));
        
        team.setWorkStartTime(workStartTime);
        team.setWorkEndTime(workEndTime);
        team.setCheckInDeadline(checkInDeadline);
        team.setCheckOutAllowedFrom(checkOutAllowedFrom);
        
        if (checkInBufferMinutes != null) {
            team.setCheckInBufferMinutes(checkInBufferMinutes);
        }
        if (checkOutBufferMinutes != null) {
            team.setCheckOutBufferMinutes(checkOutBufferMinutes);
        }
        
        return teamRepository.save(team);
    }
    @Transactional
    @CacheEvict(value = "teams", allEntries = true)
    public void deleteTeam(String teamId) {
        teamRepository.deleteById(teamId);
    }
}
