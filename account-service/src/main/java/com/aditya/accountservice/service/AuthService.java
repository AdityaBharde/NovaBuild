package com.aditya.accountservice.service;

import com.aditya.accountservice.entity.Plan;
import com.aditya.accountservice.entity.Subscription;
import com.aditya.accountservice.entity.User;
import com.aditya.accountservice.repository.PlanRepository;
import com.aditya.accountservice.repository.SubscriptionRepository;
import com.aditya.accountservice.repository.UserRepository;
import com.aditya.commonlib.exception.BadRequestException;
import com.aditya.commonlib.exception.ResourceNotFoundException;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.secret:novabuild-lovable-clone-super-secret-key-2026-production-32bytes}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_USER")
                .build();

        user = userRepository.save(user);

        // Assign default FREE subscription plan
        Plan freePlan = planRepository.findByName("FREE")
                .orElseGet(() -> planRepository.save(Plan.builder()
                        .name("FREE")
                        .priceMonthly(0.0)
                        .monthlyTokenLimit(100000)
                        .maxProjects(5)
                        .build()));

        Subscription subscription = Subscription.builder()
                .userId(user.getId())
                .plan(freePlan)
                .status("ACTIVE")
                .tokensUsedThisMonth(0)
                .currentPeriodEnd(LocalDateTime.now().plusDays(30))
                .build();

        subscriptionRepository.save(subscription);

        String token = generateJwtToken(user);
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .token(token)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid credentials");
        }

        String token = generateJwtToken(user);
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .token(token)
                .build();
    }

    private String generateJwtToken(User user) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(user.getId())
                .claims(Map.of("email", user.getEmail(), "role", user.getRole()))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(key)
                .compact();
    }

    @Data
    @Builder
    public static class RegisterRequest {
        private String email;
        private String password;
        private String name;
    }

    @Data
    @Builder
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    @Builder
    public static class AuthResponse {
        private String userId;
        private String email;
        private String name;
        private String role;
        private String token;
    }
}
