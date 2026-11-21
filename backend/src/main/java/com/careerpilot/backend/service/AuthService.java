package com.careerpilot.backend.service;

import com.careerpilot.backend.dto.AuthDtos.*;
import com.careerpilot.backend.entity.User;
import com.careerpilot.backend.repository.UserRepository;
import com.careerpilot.backend.security.JwtTokenProvider;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final ObjectMapper objectMapper;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        if (req.getTargetRole() != null) {
            user.setTargetRole(req.getTargetRole());
        }

        user = userRepository.save(user);
        String token = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());

        return new AuthResponse(toUserDto(user), token);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());

        return new AuthResponse(toUserDto(user), token);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toUserDto(user);
    }

    @Transactional
    public UserDto saveOnboarding(UUID userId, OnboardingRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (req.getTargetRole() != null) {
            user.setTargetRole(req.getTargetRole());
        }

        Map<String, Object> prefs = Map.of(
            "userPersona", req.getPersona() != null ? req.getPersona() : "",
            "educationLevel", req.getEducationLevel() != null ? req.getEducationLevel() : "",
            "experienceLevel", req.getExperienceLevel() != null ? req.getExperienceLevel() : "",
            "careerGoals", req.getCareerGoals() != null ? req.getCareerGoals() : Collections.emptyList(),
            "onboardingCompleted", true
        );

        try {
            user.setCareerPreferences(objectMapper.writeValueAsString(prefs));
        } catch (Exception ignored) {}

        user = userRepository.save(user);
        return toUserDto(user);
    }

    private UserDto toUserDto(User user) {
        Map<String, Object> prefs = Collections.emptyMap();
        if (user.getCareerPreferences() != null) {
            try {
                prefs = objectMapper.readValue(user.getCareerPreferences(), new TypeReference<>() {});
            } catch (Exception ignored) {}
        }

        UserDto dto = new UserDto();
        dto.setId(user.getId().toString());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setTargetRole(user.getTargetRole());
        dto.setYearsExperience(user.getYearsExperience());
        dto.setLocation(user.getLocation());
        dto.setGithubUrl(user.getGithubUrl());
        dto.setLinkedinUrl(user.getLinkedinUrl());
        dto.setCareerPreferences(prefs);
        return dto;
    }
}
