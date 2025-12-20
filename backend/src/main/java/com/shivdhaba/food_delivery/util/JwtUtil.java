package com.shivdhaba.food_delivery.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    
    @Value("${jwt.secret}")
    private String secret;
    
    @Value("${jwt.access-token-expiration}")
    private Long accessTokenExpiration;
    
    @Value("${jwt.refresh-token-expiration}")
    private Long refreshTokenExpiration;
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
    
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    public String generateAccessToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        return createToken(claims, username, accessTokenExpiration);
    }
    
    /**
     * Generate access token for delivery boys that expires at midnight (12:00 AM)
     */
    public String generateAccessTokenUntilMidnight(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        
        // Calculate milliseconds until midnight (12:00 AM)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime midnight = LocalDate.now().atTime(LocalTime.MIDNIGHT);
        
        // If current time is past midnight, set expiration to next midnight
        if (now.isAfter(midnight) || now.equals(midnight)) {
            midnight = midnight.plusDays(1);
        }
        
        long millisecondsUntilMidnight = java.time.Duration.between(now, midnight).toMillis();
        
        return createToken(claims, username, millisecondsUntilMidnight);
    }
    
    public String generateRefreshToken(String username) {
        return createToken(new HashMap<>(), username, refreshTokenExpiration);
    }
    
    /**
     * Generate refresh token for delivery boys that expires at midnight (12:00 AM)
     */
    public String generateRefreshTokenUntilMidnight(String username) {
        // Calculate milliseconds until midnight (12:00 AM)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime midnight = LocalDate.now().atTime(LocalTime.MIDNIGHT);
        
        // If current time is past midnight, set expiration to next midnight
        if (now.isAfter(midnight) || now.equals(midnight)) {
            midnight = midnight.plusDays(1);
        }
        
        long millisecondsUntilMidnight = java.time.Duration.between(now, midnight).toMillis();
        
        return createToken(new HashMap<>(), username, millisecondsUntilMidnight);
    }
    
    private String createToken(Map<String, Object> claims, String subject, Long expiration) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }
    
    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }
}

