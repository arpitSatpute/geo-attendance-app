package com.geoattendance.service;

import com.geoattendance.entity.User;
import com.geoattendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Utility service for retrieving authentication-related information from the
 * Spring Security context. Controllers and services can autowire this to get
 * the currently authenticated User entity.
 */
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;

    /**
     * Return the currently authenticated full User entity.
     *
     * @throws RuntimeException when there is no authenticated user or the user
     *                          cannot be found in the database.
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Unauthenticated: no security context available");
        }

        String username = authentication.getName();
        if (username == null || username.isBlank()) {
            throw new RuntimeException("Unauthenticated: principal has no username");
        }

        return userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + username));
    }

    /**
     * Convenience method returning the id of the current user.
     * Matches the `User.id` type (String).
     */
    public String getCurrentUserId() {
        return getCurrentUser().getId();
    }

    /**
     * Quick check whether there is an authenticated principal in the current context.
     */
    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated();
    }
}
