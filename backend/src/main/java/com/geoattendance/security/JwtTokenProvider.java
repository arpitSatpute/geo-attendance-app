package com.geoattendance.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpirationMs;

    // Cached signing key for this JVM process. If a valid 'app.jwt.secret' is configured
    // we compute the key once and reuse it; otherwise we generate a single ephemeral key
    // at first use and keep it for the process lifetime.
    private volatile SecretKey cachedSigningKey;

    private SecretKey getSigningKey() {
        // Return cached key if already computed
        if (cachedSigningKey != null) {
            return cachedSigningKey;
        }

        synchronized (this) {
            if (cachedSigningKey != null) {
                return cachedSigningKey;
            }

            // HS256 requires a key size >= 256 bits (32 bytes). We accept a plain-text secret
            // where each ASCII character is one byte. So require at least 32 characters.
            try {
                if (jwtSecret != null && jwtSecret.length() >= 32) {
                    byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
                    cachedSigningKey = Keys.hmacShaKeyFor(keyBytes);
                } else {
                    // Log a helpful message and generate a single ephemeral secure key for HS256
                    logger.warn("Configured JWT secret is too short for HS256 (need >= 32 chars). Generating an ephemeral secure key for this run.\n"
                            + "Please set 'app.jwt.secret' to a secure value of at least 32 ASCII characters (for example: $(openssl rand -base64 24)) in application.yml or application.properties to persist across restarts.");

                    cachedSigningKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
                }
            } catch (Exception ex) {
                logger.error("Failed to create signing key for JWT: {}", ex.getMessage(), ex);
                // As a last resort, generate a secure key so the app can continue running
                cachedSigningKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
            }

            return cachedSigningKey;
        }
    }

    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateTokenFromUsername(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        // Use parserBuilder and build() before parsing to ensure compatibility with JJWT versions
        Claims claims = Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {

        try {
            Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(authToken);
             return true;
        } catch (SecurityException ex) {
            logger.error("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }
}
