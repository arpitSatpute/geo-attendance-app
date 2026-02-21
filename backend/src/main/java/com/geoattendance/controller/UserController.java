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
import java.util.Map;
import java.util.Optional;
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

    /**
     * Get all users with MANAGER role (for manager change dropdown)
     */
    @GetMapping("/managers")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<UserDto>> getAllManagers() {
        try {
            List<User> managers = userRepository.findByRole("MANAGER");
            List<UserDto> dtoList = managers.stream()
                .map(this::toUserDto)
                .collect(Collectors.toList());
            return ResponseEntity.ok(dtoList);
        } catch (Exception e) {
            log.error("Error fetching managers: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get specific employee details (Manager/Admin only)
     */
    @GetMapping("/employee/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> getEmployeeDetails(@PathVariable String id) {
        try {
            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(toUserDto(user));
        } catch (Exception e) {
            log.error("Error fetching employee details: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update employee base salary (Manager/Admin only)
     */
    @PutMapping("/{id}/salary")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> updateBaseSalary(@PathVariable String id, @RequestBody Map<String, Double> payload) {
        try {
            Double baseSalary = payload.get("baseSalary");
            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            user.setBaseSalary(baseSalary);
            userRepository.save(user);
            
            log.info("Updated base salary for user: {} to: {}", id, baseSalary);
            return ResponseEntity.ok(toUserDto(user));
        } catch (Exception e) {
            log.error("Error updating base salary: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update employee's team (Manager/Admin only)
     */
    @PutMapping("/{id}/team")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> updateEmployeeTeam(@PathVariable String id, @RequestBody Map<String, String> payload) {
        try {
            String teamId = payload.get("teamId");
            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Remove from old team if exists
            Optional<Team> currentTeam = teamService.getTeamByEmployeeId(id);
            if (currentTeam.isPresent()) {
                teamService.removeEmployeeFromTeam(currentTeam.get().getId(), id);
            }
            
            // Add to new team if specified
            if (teamId != null && !teamId.isEmpty()) {
                // We need addEmployeeToTeamById in TeamService or use the existing email one.
                // Let's add by ID logic here since we have the ID.
                Team team = teamService.getTeamById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));
                
                if (team.getEmployeeIds() == null) {
                    team.setEmployeeIds(new ArrayList<>());
                }
                if (!team.getEmployeeIds().contains(id)) {
                    team.getEmployeeIds().add(id);
                    // TeamService remove/add methods are @Transactional. 
                    // Let's use service methods instead.
                }
                // Updated logic: Actually TeamService needs an addEmployeeById method.
                // For now, let's just use the email one since we have the user.
                teamService.addEmployeeToTeamByEmail(teamId, user.getEmail());
            }
            
            user.setTeamId(teamId);
            userRepository.save(user);
            
            return ResponseEntity.ok(toUserDto(user));
        } catch (Exception e) {
            log.error("Error updating team: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update employee's manager (Admin/Manager only)
     * Managers can hand over their employees to other managers
     */
    @PutMapping("/{id}/manager")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> updateEmployeeManager(@PathVariable String id, @RequestBody Map<String, String> payload) {
        try {
            String managerId = payload.get("managerId");
            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            User newManager = null;
            if (managerId != null && !managerId.isEmpty()) {
                newManager = userRepository.findById(managerId)
                    .orElseThrow(() -> new RuntimeException("Manager not found"));
            }
            
            user.setManager(newManager);
            user.setManagerId(managerId);
            userRepository.save(user);
            
            return ResponseEntity.ok(toUserDto(user));
        } catch (Exception e) {
            log.error("Error updating manager: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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
        dto.setBaseSalary(user.getBaseSalary());
        dto.setTeamId(user.getTeamId());
        dto.setManagerId(user.getManagerId());
        if (user.getManager() != null) {
            dto.setManagerName(user.getManager().getFirstName() + " " + user.getManager().getLastName());
        }
        dto.setCompanyEmail(user.getCompanyEmail());
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
        private Double baseSalary;
        private String teamId;
        private String managerId;
        private String managerName;
        private String companyEmail;
        
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
        
        public Double getBaseSalary() { return baseSalary; }
        public void setBaseSalary(Double baseSalary) { this.baseSalary = baseSalary; }

        public String getTeamId() { return teamId; }
        public void setTeamId(String teamId) { this.teamId = teamId; }

        public String getManagerId() { return managerId; }
        public void setManagerId(String managerId) { this.managerId = managerId; }

        public String getManagerName() { return managerName; }
        public void setManagerName(String managerName) { this.managerName = managerName; }

        public String getCompanyEmail() { return companyEmail; }
        public void setCompanyEmail(String companyEmail) { this.companyEmail = companyEmail; }
    }
}
