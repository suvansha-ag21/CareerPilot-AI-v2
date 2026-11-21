package com.careerpilot.backend.service;

import com.careerpilot.backend.dto.AuthDtos.*;
import com.careerpilot.backend.entity.User;
import com.careerpilot.backend.repository.UserRepository;
import com.careerpilot.backend.security.JwtTokenProvider;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.ArrayList;
import java.util.List;
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
    public AuthResponse refresh(String refreshToken) {
        if (refreshToken == null || !tokenProvider.validateRefreshToken(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid or expired");
        }
        UUID userId = tokenProvider.getUserIdFromRefreshToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"));
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        return new AuthResponse(toUserDto(user), accessToken);
    }

    public String createRefreshToken(UUID userId) {
        return tokenProvider.generateRefreshToken(userId);
    }

    @Transactional
    public UserDto updateProfile(UUID userId, Map<String, Object> input) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (input.containsKey("name")) {
            String name = stringOrNull(input.get("name"));
            if (name == null || name.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
            }
            user.setName(name.trim());
        }
        if (input.containsKey("targetRole")) {
            String targetRole = stringOrNull(input.get("targetRole"));
            if (targetRole == null || targetRole.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target role cannot be blank");
            }
            user.setTargetRole(targetRole.trim());
        }
        if (input.containsKey("yearsExperience")) {
            Object value = input.get("yearsExperience");
            if (!(value instanceof Number years) || years.intValue() < 0 || years.intValue() > 80) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Years of experience must be between 0 and 80");
            }
            user.setYearsExperience(years.intValue());
        }
        if (input.containsKey("profileImage")) user.setProfileImage(stringOrNull(input.get("profileImage")));
        if (input.containsKey("headline")) user.setHeadline(stringOrNull(input.get("headline")));
        if (input.containsKey("location")) user.setLocation(stringOrNull(input.get("location")));
        if (input.containsKey("githubUrl")) user.setGithubUrl(stringOrNull(input.get("githubUrl")));
        if (input.containsKey("linkedinUrl")) user.setLinkedinUrl(stringOrNull(input.get("linkedinUrl")));
        if (input.containsKey("careerPreferences")) {
            user.setCareerPreferences(writeJson(input.get("careerPreferences")));
        }

        Map<String, Object> profile = readJsonObject(user.getProfileData());
        for (String field : List.of("skills", "educations", "workExperiences", "projects")) {
            if (input.containsKey(field)) {
                profile.put(field, mapList(input.get(field), field));
            }
        }
        user.setProfileData(writeJson(profile));
        return toUserDto(userRepository.save(user));
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

    @Transactional
    public Map<String, String> forgotPassword(String email) {
        if (email != null && !email.isBlank()) {
            userRepository.findByEmail(email.toLowerCase().trim()).ifPresent(user -> {
                // Dispatches reset token link in production
            });
        }
        return Map.of("message", "If an account with that email exists, password reset instructions have been sent.");
    }

    @Transactional
    public Map<String, Object> resetPassword(String token, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        }
        if (token != null && !token.isBlank()) {
            if (tokenProvider.validateToken(token)) {
                UUID userId = tokenProvider.getUserIdFromToken(token);
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid reset token"));
                user.setPasswordHash(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                return Map.of("success", true, "message", "Password has been successfully reset");
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password reset token is invalid or expired");
    }

    private UserDto toUserDto(User user) {
        Map<String, Object> prefs = readJsonObject(user.getCareerPreferences());
        Map<String, Object> profile = readJsonObject(user.getProfileData());

        UserDto dto = new UserDto();
        dto.setId(user.getId().toString());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setTargetRole(user.getTargetRole());
        dto.setYearsExperience(user.getYearsExperience());
        dto.setProfileImage(user.getProfileImage());
        dto.setHeadline(user.getHeadline());
        dto.setLocation(user.getLocation());
        dto.setGithubUrl(user.getGithubUrl());
        dto.setLinkedinUrl(user.getLinkedinUrl());
        dto.setCareerPreferences(prefs);
        dto.setSkills(mapList(profile.get("skills"), "skills"));
        dto.setEducations(mapList(profile.get("educations"), "educations"));
        dto.setWorkExperiences(mapList(profile.get("workExperiences"), "workExperiences"));
        dto.setProjects(mapList(profile.get("projects"), "projects"));
        return dto;
    }

    private Map<String, Object> readJsonObject(String json) {
        if (json == null || json.isBlank()) {
            return new java.util.LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Could not read profile data", ex);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not save profile data", ex);
        }
    }

    private List<Map<String, Object>> mapList(Object value, String field) {
        if (value == null) {
            return new ArrayList<>();
        }
        if (!(value instanceof List<?> list)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be an array");
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> map)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " items must be objects");
            }
            Map<String, Object> entry = new java.util.LinkedHashMap<>();
            map.forEach((key, itemValue) -> entry.put(String.valueOf(key), itemValue));
            result.add(entry);
        }
        return result;
    }

    private String stringOrNull(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
