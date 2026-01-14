package com.geoattendance.controller;

import com.geoattendance.entity.User;
import com.geoattendance.repository.UserRepository;
import jakarta.annotation.security.PermitAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Temporary debug endpoints to inspect persisted data when a DB client is not available.
 * This controller intentionally omits passwords and sensitive fields.
 * It is mapped under /auth so it remains publicly accessible given the current SecurityConfig
 * which permits /api/auth/** and /auth/**. Remove this file before production.
 */
@RestController
@RequestMapping("/auth/debug")
@PermitAll
public class DebugController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> listUsers() {
        List<User> users = userRepository.findAll();

        List<Map<String, Object>> result = users.stream().map(u -> Map.<String, Object>of(
                "id", u.getId(),
                "email", u.getEmail(),
                "firstName", u.getFirstName(),
                "lastName", u.getLastName(),
                "phone", u.getPhone(),
                "role", u.getRole(),
                "active", u.isActive(),
                "createdAt", u.getCreatedAt(),
                "updatedAt", u.getUpdatedAt()
        )).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
