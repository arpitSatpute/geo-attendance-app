package com.geoattendance.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String servletPath = request.getServletPath();

        // Log for debugging (commons-logging logger accepts single object)
        logger.debug("JWT Filter - URI: " + path + " , ServletPath: " + servletPath);

        // Skip JWT filter for all auth endpoints (login, register, logout)
        boolean shouldSkip = path.startsWith("/auth") || path.startsWith("/api/auth") ||
                path.contains("/swagger-ui") || path.contains("/v3/api-docs");

        if (shouldSkip) {
            logger.debug("Skipping JWT filter for path: " + path);
        }

        return shouldSkip;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (!StringUtils.hasText(jwt)) {
                logger.debug("No JWT found in request headers for URI: " + request.getRequestURI());
            } else {
                // Mask token for logging (show first/last few chars)
                String masked = jwt.length() > 10 ? jwt.substring(0, 6) + "..." + jwt.substring(jwt.length()-4) : jwt;
                logger.debug("JWT found in request: " + masked + " (length=" + jwt.length() + ")");

                boolean valid = false;
                try {
                    valid = jwtTokenProvider.validateToken(jwt);
                } catch (Exception e) {
                    logger.error("Exception during JWT validation: " + e.getMessage(), e);
                }

                if (valid) {
                    String username = jwtTokenProvider.getUsernameFromToken(jwt);
                    logger.debug("JWT validated; username from token: " + username);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("SecurityContext updated with authentication for user: " + username);
                } else {
                    logger.debug("JWT invalid for request URI: " + request.getRequestURI());
                }
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context: " + ex.getMessage(), ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
