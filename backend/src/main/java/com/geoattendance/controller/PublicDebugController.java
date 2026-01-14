package com.geoattendance.controller;

import com.geoattendance.entity.User;
import com.geoattendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * A public debug endpoint that is explicitly permitted by SecurityConfig.
 * Returns user list without any password field. Remove before production.
 */
@RestController
@RequestMapping("/public")
public class PublicDebugController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> listUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = users.stream().map(u -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", u.getId());
            m.put("email", u.getEmail());
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("phone", u.getPhone());
            m.put("role", u.getRole());
            m.put("active", u.isActive());
            m.put("createdAt", u.getCreatedAt());
            m.put("updatedAt", u.getUpdatedAt());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}


