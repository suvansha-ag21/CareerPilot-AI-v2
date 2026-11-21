package com.careerpilot.backend.service;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.entity.User;
import com.careerpilot.backend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class SkillsService {

    private final UserRepository userRepository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;

    private static final List<Map<String, String>> DEFAULT_CATALOG = List.of(
            Map.of("id", "c1", "name", "Java", "category", "BACKEND"),
            Map.of("id", "c2", "name", "Spring Boot", "category", "BACKEND"),
            Map.of("id", "c3", "name", "React", "category", "FRONTEND"),
            Map.of("id", "c4", "name", "PostgreSQL", "category", "DATABASE"),
            Map.of("id", "c5", "name", "Docker", "category", "DEVOPS"),
            Map.of("id", "c6", "name", "Kubernetes", "category", "DEVOPS"),
            Map.of("id", "c7", "name", "Python", "category", "BACKEND"),
            Map.of("id", "c8", "name", "Data Structures", "category", "CORE_CS"),
            Map.of("id", "c9", "name", "System Design", "category", "CORE_CS"),
            Map.of("id", "c10", "name", "Machine Learning", "category", "AI_ML")
    );

    public SkillsService(
            UserRepository userRepository,
            AiServiceClient aiServiceClient,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.aiServiceClient = aiServiceClient;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> getInventory(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Map<String, Object> profile = readJsonObject(user.getProfileData());
        List<Map<String, Object>> skills = getSkillsList(profile);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("userSkills", skills);
        res.put("catalog", DEFAULT_CATALOG);
        return res;
    }

    public Map<String, Object> upsertSkill(UUID userId, Map<String, Object> input) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String name = String.valueOf(input.getOrDefault("name", "")).trim();
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Skill name is required");
        }

        Map<String, Object> profile = readJsonObject(user.getProfileData());
        List<Map<String, Object>> skills = getSkillsList(profile);

        boolean updated = false;
        for (Map<String, Object> s : skills) {
            if (name.equalsIgnoreCase(String.valueOf(s.get("name")))) {
                if (input.containsKey("category")) s.put("category", input.get("category"));
                if (input.containsKey("proficiencyLevel")) s.put("proficiencyLevel", input.get("proficiencyLevel"));
                if (input.containsKey("confidenceScore")) s.put("confidenceScore", input.get("confidenceScore"));
                updated = true;
                break;
            }
        }

        if (!updated) {
            Map<String, Object> newSkill = new LinkedHashMap<>();
            newSkill.put("id", UUID.randomUUID().toString());
            newSkill.put("name", name);
            newSkill.put("category", input.getOrDefault("category", "BACKEND"));
            newSkill.put("proficiencyLevel", input.getOrDefault("proficiencyLevel", "INTERMEDIATE"));
            newSkill.put("confidenceScore", input.getOrDefault("confidenceScore", 70));
            newSkill.put("source", input.getOrDefault("source", "PROFILE"));
            skills.add(newSkill);
        }

        profile.put("skills", skills);
        user.setProfileData(writeJsonObject(profile));
        userRepository.save(user);

        return getInventory(userId);
    }

    public Map<String, Object> removeSkill(UUID userId, String skillId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Map<String, Object> profile = readJsonObject(user.getProfileData());
        List<Map<String, Object>> skills = getSkillsList(profile);
        skills.removeIf(s -> skillId.equalsIgnoreCase(String.valueOf(s.get("id")))
                || skillId.equalsIgnoreCase(String.valueOf(s.get("name"))));

        profile.put("skills", skills);
        user.setProfileData(writeJsonObject(profile));
        userRepository.save(user);

        return getInventory(userId);
    }

    public Map<String, Object> analyzeGap(UUID userId, Map<String, Object> input) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Map<String, Object> profile = readJsonObject(user.getProfileData());
        List<Map<String, Object>> userSkills = getSkillsList(profile);
        List<String> currentSkillNames = userSkills.stream().map(s -> String.valueOf(s.get("name"))).toList();

        String targetRole = String.valueOf(input.getOrDefault("targetRole", user.getTargetRole()));

        try {
            Map<String, Object> aiReq = new LinkedHashMap<>(input);
            aiReq.put("user_id", userId.toString());
            aiReq.put("target_role", targetRole);
            aiReq.put("candidate_skills", currentSkillNames);
            Map aiRes = aiServiceClient.analyzeSkillGap(aiReq).block();
            if (aiRes != null) return aiRes;
        } catch (Exception ignored) {}

        // Fallback robust skill gap calculation
        List<String> requiredCore = List.of("Java", "Spring Boot", "Data Structures", "PostgreSQL", "REST APIs", "Docker");
        List<Map<String, Object>> breakdown = new ArrayList<>();
        int covered = 0;
        for (String req : requiredCore) {
            boolean has = currentSkillNames.stream().anyMatch(s -> s.equalsIgnoreCase(req));
            if (has) covered++;
            breakdown.add(Map.of(
                    "skill", req,
                    "status", has ? "COVERED" : "MISSING",
                    "importance", "HIGH",
                    "learningResource", "Comprehensive guide for " + req
            ));
        }

        double score = Math.round(((double) covered / requiredCore.size()) * 1000.0) / 10.0;
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("targetRole", targetRole);
        report.put("readinessScore", score);
        report.put("totalRequired", requiredCore.size());
        report.put("coveredCount", covered);
        report.put("missingCount", requiredCore.size() - covered);
        report.put("skillsBreakdown", breakdown);
        report.put("priorityRecommendations", List.of("Focus on containerization and cloud-native patterns."));
        return report;
    }

    private List<Map<String, Object>> getSkillsList(Map<String, Object> profile) {
        List<Map<String, Object>> skills = new ArrayList<>();
        if (profile.get("skills") instanceof List<?> list) {
            list.forEach(item -> {
                if (item instanceof Map<?, ?> m) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    m.forEach((k, v) -> map.put(String.valueOf(k), v));
                    if (!map.containsKey("id")) map.put("id", UUID.randomUUID().toString());
                    skills.add(map);
                }
            });
        }
        return skills;
    }

    private Map<String, Object> readJsonObject(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private String writeJsonObject(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "{}";
        }
    }
}
