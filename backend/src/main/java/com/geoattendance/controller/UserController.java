package com.geoattendance.controller;

import com.geoattendance.entity.Team;
import com.geoattendance.entity.User;
import com.geoattendance.repository.UserRepository;
import com.geoattendance.service.AuthenticationService;
import com.geoattendance.service.TeamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TeamService teamService;
    
    @Autowired
    private AuthenticationService authenticationService;

    /**
     * Get all team members (employees) managed by the current manager.
     * This aggregates employees from all teams managed by the current user.
     */
    @GetMapping("/team-members")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<UserDto>> getTeamMembers() {
        try {
            User currentUser = authenticationService.getCurrentUser();
            String managerId = currentUser.getId();

            log.info("Fetching team members for manager: {}", managerId);

            // Get all teams managed by this user
            List<Team> teams = teamService.getTeamsByManager(managerId);

            // Collect all unique employee IDs
            Set<String> employeeIds = new HashSet<>();
            for (Team team : teams) {
                if (team.getEmployeeIds() != null) {
                    employeeIds.addAll(team.getEmployeeIds());
                }
            }

            // Fetch all employees
            List<User> employees = employeeIds.isEmpty() 
                ? new ArrayList<>() 
                : userRepository.findAllById(employeeIds);

            // Convert to DTOs (to avoid exposing sensitive data like passwords)
            List<UserDto> userDtos = employees.stream()
                .map(this::toUserDto)
                .collect(Collectors.toList());

            log.info("Found {} team members for manager: {}", userDtos.size(), managerId);

            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            log.error("Error fetching team members: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all users (Admin only)
     */
    @GetMapping("")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            List<UserDto> userDtos = users.stream()
                .map(this::toUserDto)
                .collect(Collectors.toList());
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            log.error("Error fetching all users: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all employees (for salary calculation dropdown)
     */
    @GetMapping("/employees")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<UserDto>> getAllEmployees() {
        try {
            List<User> employees = userRepository.findByRole("EMPLOYEE");
            List<UserDto> userDtos = employees.stream()
                .map(this::toUserDto)
                .collect(Collectors.toList());
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            log.error("Error fetching employees: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    private UserDto toUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRole(user.getRole());
        dto.setPhone(user.getPhone());
        dto.setActive(user.isActive());
        return dto;
    }

    // DTO class to avoid exposing sensitive user data
    public static class UserDto {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private String role;
        private String phone;
        private boolean active;
        
        public UserDto() {}
        
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
    }
}
