package com.geoattendance.controller;

import com.geoattendance.dto.RegisterRequest;
import com.geoattendance.entity.User;
import com.geoattendance.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/users/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Email already exists");
            return ResponseEntity.badRequest().body(error);
        }

        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setCompanyEmail(registerRequest.getCompanyEmail());
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        
        // Handle both phone and phoneNumber
        String phone = registerRequest.getPhoneNumber() != null ? 
                      registerRequest.getPhoneNumber() : registerRequest.getPhone();
        user.setPhone(phone);
        
        user.setRole(registerRequest.getRole() != null ? registerRequest.getRole() : "EMPLOYEE");
        user.setDepartment(registerRequest.getDepartment());
        user.setBaseSalary(registerRequest.getBaseSalary());
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);

        logger.info("Admin created user account for '{}' with role '{}'", user.getEmail(), user.getRole());

        Map<String, String> response = new HashMap<>();
        response.put("message", "User created successfully by admin");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
