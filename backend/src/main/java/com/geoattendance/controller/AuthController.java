package com.geoattendance.controller;

import com.geoattendance.dto.AuthRequest;
import com.geoattendance.dto.AuthResponse;
import com.geoattendance.dto.RegisterRequest;
import com.geoattendance.entity.User;
import com.geoattendance.entity.Team;
import com.geoattendance.repository.UserRepository;
import com.geoattendance.security.JwtTokenProvider;
import com.geoattendance.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private TeamService teamService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody AuthRequest authRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authRequest.getEmail(),
                            authRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtTokenProvider.generateToken(authentication);

            User user = userRepository.findByEmail(authRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            AuthResponse response = new AuthResponse();
            response.setToken(jwt);
            response.setUser(getUserDto(user));

            // Log success (mask token for safety)
            logger.info("User '{}' authenticated successfully", authRequest.getEmail());
            logger.debug("Generated JWT (masked) for {}: {}", authRequest.getEmail(), jwt != null && jwt.length() > 20 ? jwt.substring(0,20) + "..." : jwt);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.warn("Authentication failed for {}: {}", authRequest.getEmail(), e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Email already exists");
            return ResponseEntity.badRequest().body(error);
        }

        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setPhone(registerRequest.getPhone());
        user.setRole(registerRequest.getRole() != null ? registerRequest.getRole() : "EMPLOYEE");
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User registered successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        SecurityContextHolder.clearContext();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logout successful");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(getUserDto(user));
    }

    private Map<String, Object> getUserDto(User user) {
        Map<String, Object> userDto = new HashMap<>();
        userDto.put("id", user.getId());
        userDto.put("email", user.getEmail());
        userDto.put("firstName", user.getFirstName());
        userDto.put("lastName", user.getLastName());
        userDto.put("phone", user.getPhone());
        userDto.put("role", user.getRole());
        userDto.put("active", user.isActive());
        userDto.put("department", user.getDepartment());
        
        // Include manager information if available
        if (user.getManager() != null) {
            Map<String, Object> managerDto = new HashMap<>();
            managerDto.put("id", user.getManager().getId());
            managerDto.put("firstName", user.getManager().getFirstName());
            managerDto.put("lastName", user.getManager().getLastName());
            managerDto.put("email", user.getManager().getEmail());
            managerDto.put("phone", user.getManager().getPhone());
            userDto.put("manager", managerDto);
        }
        
        // Include team information if user is an employee
        if ("EMPLOYEE".equalsIgnoreCase(user.getRole())) {
            Optional<Team> teamOpt = teamService.getTeamByEmployeeId(user.getId());
            if (teamOpt.isPresent()) {
                Team team = teamOpt.get();
                Map<String, Object> teamDto = new HashMap<>();
                teamDto.put("id", team.getId());
                teamDto.put("name", team.getName());
                teamDto.put("managerId", team.getManagerId());
                userDto.put("team", teamDto);
            }
        }
        
        return userDto;
    }
}
