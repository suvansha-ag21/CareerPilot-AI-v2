package com.careerpilot.backend.service;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.entity.ResumeRecord;
import com.careerpilot.backend.entity.User;
import com.careerpilot.backend.repository.ResumeRecordRepository;
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
    private final ResumeRecordRepository resumeRepository;
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
            ResumeRecordRepository resumeRepository,
            AiServiceClient aiServiceClient,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
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
        List<String> currentSkillNames = userSkills.stream()
                .map(s -> String.valueOf(s.getOrDefault("name", "")).trim())
                .filter(s -> !s.isEmpty())
                .toList();

        String targetRole = String.valueOf(input.getOrDefault("targetRole", user.getTargetRole() != null ? user.getTargetRole() : "Full Stack Developer")).trim();
        if (targetRole.isEmpty()) {
            targetRole = "Full Stack Developer";
        }
        String learningPreference = String.valueOf(input.getOrDefault("learningPreference", "BEGINNER_TO_ADVANCED"));

        List<String> resumeSkills = new ArrayList<>();
        String resumeSummary = "";
        if (input.get("resumeId") != null) {
            try {
                UUID rId = UUID.fromString(String.valueOf(input.get("resumeId")));
                ResumeRecord rRec = resumeRepository.findByIdAndUserId(rId, userId).orElse(null);
                if (rRec != null) {
                    Map<String, Object> rData = readJsonObject(rRec.getRecordData());
                    if (rData.get("skills") instanceof List<?> list) {
                        list.forEach(item -> resumeSkills.add(String.valueOf(item)));
                    }
                    resumeSummary = String.valueOf(rData.getOrDefault("extractedText", ""));
                    if (resumeSummary.length() > 1000) {
                        resumeSummary = resumeSummary.substring(0, 1000);
                    }
                }
            } catch (Exception ignored) {}
        }

        try {
            Map<String, Object> aiReq = new LinkedHashMap<>();
            aiReq.put("target_role", targetRole);
            aiReq.put("learning_preference", learningPreference);

            List<Map<String, Object>> currentSkillsPayload = userSkills.stream().map(s -> {
                Map<String, Object> sk = new LinkedHashMap<>();
                String sName = String.valueOf(s.getOrDefault("name", ""));
                sk.put("name", sName);
                sk.put("normalizedName", sName.toLowerCase().trim());
                sk.put("category", s.getOrDefault("category", "BACKEND"));
                sk.put("proficiencyLevel", s.getOrDefault("proficiencyLevel", "INTERMEDIATE"));
                sk.put("confidenceScore", s.getOrDefault("confidenceScore", 60));
                sk.put("source", s.getOrDefault("source", "PROFILE"));
                return sk;
            }).toList();

            aiReq.put("current_skills", currentSkillsPayload);
            aiReq.put("resume_skills", resumeSkills);
            if (!resumeSummary.isEmpty()) {
                aiReq.put("resume_summary", resumeSummary);
            }

            Map aiRes = aiServiceClient.analyzeSkillGap(aiReq).block();
            if (aiRes != null) {
                Map<String, Object> normalized = normalizeSkillGapReport(aiRes, targetRole);
                return normalized;
            }
        } catch (Exception ignored) {}

        return createDefaultSkillGapReport(targetRole, currentSkillNames);
    }

    private Map<String, Object> normalizeSkillGapReport(Map raw, String targetRole) {
        Map<String, Object> out = new LinkedHashMap<>();
        raw.forEach((k, v) -> out.put(String.valueOf(k), v));

        out.putIfAbsent("targetRole", out.getOrDefault("target_role", targetRole));
        out.putIfAbsent("target_role", out.get("targetRole"));

        double readiness = 65.0;
        if (out.containsKey("readiness_pct")) readiness = toDouble(out.get("readiness_pct"), 65.0);
        else if (out.containsKey("readinessPct")) readiness = toDouble(out.get("readinessPct"), 65.0);
        else if (out.containsKey("readinessScore")) readiness = toDouble(out.get("readinessScore"), 65.0);
        out.put("readinessPct", readiness);
        out.put("readiness_pct", readiness);

        int total = toInt(out.getOrDefault("total_required", out.get("totalRequired")), 8);
        int mastered = toInt(out.getOrDefault("mastered_count", out.get("masteredCount")), 3);
        int needsLevelUp = toInt(out.getOrDefault("needs_level_up_count", out.get("needsLevelUpCount")), 2);
        int missing = toInt(out.getOrDefault("missing_count", out.get("missingCount")), 3);
        out.put("totalRequired", total);
        out.put("total_required", total);
        out.put("masteredCount", mastered);
        out.put("mastered_count", mastered);
        out.put("needsLevelUpCount", needsLevelUp);
        out.put("needs_level_up_count", needsLevelUp);
        out.put("missingCount", missing);
        out.put("missing_count", missing);

        List<Map<String, Object>> benchmarks = new ArrayList<>();
        Object bObj = out.getOrDefault("benchmarks", out.get("skillsBreakdown"));
        if (bObj instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    Map<String, Object> bm = new LinkedHashMap<>();
                    m.forEach((k, v) -> bm.put(String.valueOf(k), v));
                    bm.putIfAbsent("skill", bm.getOrDefault("name", "Skill"));
                    bm.putIfAbsent("category", "BACKEND");
                    bm.putIfAbsent("importance", "HIGH");
                    bm.putIfAbsent("requiredLevel", "INTERMEDIATE");
                    bm.putIfAbsent("currentLevel", "BEGINNER");
                    bm.putIfAbsent("confidenceScore", 60);
                    bm.putIfAbsent("status", "MISSING");
                    bm.putIfAbsent("recommendedAction", "Study core fundamentals and apply in projects.");
                    if (!(bm.get("resources") instanceof List<?>)) {
                        bm.put("resources", List.of(Map.of(
                                "title", "Official Documentation",
                                "type", "DOC",
                                "url", "https://developer.mozilla.org",
                                "estimatedHours", 4
                        )));
                    }
                    benchmarks.add(bm);
                }
            }
        }
        out.put("benchmarks", benchmarks);

        List<String> learningOrder = new ArrayList<>();
        Object loObj = out.getOrDefault("learningOrder", out.get("learning_order"));
        if (loObj instanceof List<?> list) {
            list.forEach(i -> learningOrder.add(String.valueOf(i)));
        } else {
            benchmarks.stream()
                    .filter(b -> !"MASTERED".equals(b.get("status")))
                    .map(b -> String.valueOf(b.get("skill")))
                    .forEach(learningOrder::add);
        }
        out.put("learningOrder", learningOrder);
        out.put("learning_order", learningOrder);

        List<Map<String, Object>> categories = new ArrayList<>();
        Object catObj = out.getOrDefault("categoryBreakdown", out.get("category_breakdown"));
        if (catObj instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    Map<String, Object> cat = new LinkedHashMap<>();
                    m.forEach((k, v) -> cat.put(String.valueOf(k), v));
                    categories.add(cat);
                }
            }
        }
        if (categories.isEmpty()) {
            categories.add(Map.of("category", "BACKEND", "label", "Backend Systems", "covered", 2, "total", 3, "coveragePct", 66.7));
            categories.add(Map.of("category", "CORE_CS", "label", "Core CS & DSA", "covered", 1, "total", 2, "coveragePct", 50.0));
            categories.add(Map.of("category", "DATABASE", "label", "Databases & SQL", "covered", 1, "total", 1, "coveragePct", 100.0));
            categories.add(Map.of("category", "DEVOPS", "label", "Cloud & DevOps", "covered", 0, "total", 2, "coveragePct", 0.0));
        }
        out.put("categoryBreakdown", categories);
        out.put("category_breakdown", categories);

        String aiSummary = String.valueOf(out.getOrDefault("aiSummary", out.getOrDefault("ai_summary",
                "Strong foundations detected. Prioritize system design, caching layers, and containerized deployments to accelerate senior interview readiness.")));
        out.put("aiSummary", aiSummary);
        out.put("ai_summary", aiSummary);

        List<String> quickWins = new ArrayList<>();
        Object qwObj = out.getOrDefault("quickWins", out.get("quick_wins"));
        if (qwObj instanceof List<?> list) {
            list.forEach(i -> quickWins.add(String.valueOf(i)));
        }
        if (quickWins.isEmpty()) {
            quickWins.add("Implement connection pooling and indexing on top PostgreSQL queries");
            quickWins.add("Write unit and integration tests with 80%+ coverage for core REST endpoints");
            quickWins.add("Containerize your backend service with multi-stage Docker build");
        }
        out.put("quickWins", quickWins);
        out.put("quick_wins", quickWins);

        return out;
    }

    private Map<String, Object> createDefaultSkillGapReport(String targetRole, List<String> currentSkillNames) {
        List<Map<String, Object>> benchmarks = new ArrayList<>();
        benchmarks.add(createBenchmark("Java", "BACKEND", "CRITICAL", "INTERMEDIATE", currentSkillNames, "Comprehensive Java mastery guide"));
        benchmarks.add(createBenchmark("Spring Boot", "BACKEND", "CRITICAL", "INTERMEDIATE", currentSkillNames, "Spring Boot production guide"));
        benchmarks.add(createBenchmark("Data Structures", "CORE_CS", "CRITICAL", "INTERMEDIATE", currentSkillNames, "LeetCode & DSA patterns"));
        benchmarks.add(createBenchmark("PostgreSQL", "DATABASE", "IMPORTANT", "INTERMEDIATE", currentSkillNames, "PostgreSQL performance tuning"));
        benchmarks.add(createBenchmark("REST APIs", "BACKEND", "CRITICAL", "INTERMEDIATE", currentSkillNames, "API design & security patterns"));
        benchmarks.add(createBenchmark("Docker", "DEVOPS", "IMPORTANT", "BEGINNER", currentSkillNames, "Docker containerization sprint"));
        benchmarks.add(createBenchmark("System Design", "CORE_CS", "IMPORTANT", "INTERMEDIATE", currentSkillNames, "Distributed systems primer"));
        benchmarks.add(createBenchmark("Git & CI/CD", "DEVOPS", "IMPORTANT", "INTERMEDIATE", currentSkillNames, "GitHub Actions workflow setup"));

        int mastered = (int) benchmarks.stream().filter(b -> "MASTERED".equals(b.get("status"))).count();
        int needsLevelUp = (int) benchmarks.stream().filter(b -> "NEEDS_LEVEL_UP".equals(b.get("status"))).count();
        int missing = (int) benchmarks.stream().filter(b -> "MISSING".equals(b.get("status"))).count();
        double readinessPct = Math.round(((mastered * 1.0 + needsLevelUp * 0.5) / benchmarks.size()) * 1000.0) / 10.0;

        List<String> learningOrder = benchmarks.stream()
                .filter(b -> !"MASTERED".equals(b.get("status")))
                .map(b -> String.valueOf(b.get("skill")))
                .toList();

        List<Map<String, Object>> categories = List.of(
                Map.of("category", "BACKEND", "label", "Backend Systems", "covered", Math.min(mastered, 3), "total", 3, "coveragePct", Math.round((Math.min(mastered, 3) / 3.0) * 1000.0) / 10.0),
                Map.of("category", "CORE_CS", "label", "Core CS & DSA", "covered", 1, "total", 2, "coveragePct", 50.0),
                Map.of("category", "DATABASE", "label", "Databases & SQL", "covered", 1, "total", 1, "coveragePct", 100.0),
                Map.of("category", "DEVOPS", "label", "Cloud & DevOps", "covered", 0, "total", 2, "coveragePct", 0.0)
        );

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("targetRole", targetRole);
        out.put("target_role", targetRole);
        out.put("readinessPct", readinessPct);
        out.put("readiness_pct", readinessPct);
        out.put("totalRequired", benchmarks.size());
        out.put("total_required", benchmarks.size());
        out.put("masteredCount", mastered);
        out.put("mastered_count", mastered);
        out.put("needsLevelUpCount", needsLevelUp);
        out.put("needs_level_up_count", needsLevelUp);
        out.put("missingCount", missing);
        out.put("missing_count", missing);
        out.put("benchmarks", benchmarks);
        out.put("learningOrder", learningOrder);
        out.put("learning_order", learningOrder);
        out.put("categoryBreakdown", categories);
        out.put("category_breakdown", categories);
        out.put("aiSummary", "Solid software fundamentals. Focus next on system architecture and cloud containerization to reach full " + targetRole + " readiness.");
        out.put("ai_summary", "Solid software fundamentals. Focus next on system architecture and cloud containerization to reach full " + targetRole + " readiness.");
        out.put("quickWins", List.of(
                "Complete a high-concurrency microservice design simulation",
                "Practice index analysis with EXPLAIN ANALYZE on PostgreSQL tables",
                "Deploy a multi-stage Dockerized API to a cloud container registry"
        ));
        out.put("quick_wins", List.of(
                "Complete a high-concurrency microservice design simulation",
                "Practice index analysis with EXPLAIN ANALYZE on PostgreSQL tables",
                "Deploy a multi-stage Dockerized API to a cloud container registry"
        ));
        return out;
    }

    private Map<String, Object> createBenchmark(String name, String cat, String importance, String reqLvl, List<String> currentSkills, String resourceTitle) {
        boolean has = currentSkills.stream().anyMatch(s -> s.equalsIgnoreCase(name));
        Map<String, Object> bm = new LinkedHashMap<>();
        bm.put("skill", name);
        bm.put("category", cat);
        bm.put("importance", importance);
        bm.put("requiredLevel", reqLvl);
        bm.put("currentLevel", has ? "INTERMEDIATE" : null);
        bm.put("confidenceScore", has ? 80 : 0);
        bm.put("status", has ? "MASTERED" : "MISSING");
        bm.put("recommendedAction", has ? "Continue advanced exercises" : "Build a project using " + name);
        bm.put("resources", List.of(Map.of(
                "title", resourceTitle,
                "type", "DOC",
                "url", "https://developer.mozilla.org",
                "estimatedHours", 6
        )));
        return bm;
    }

    private double toDouble(Object value, double fallback) {
        if (value instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception e) {
            return fallback;
        }
    }

    private int toInt(Object value, int fallback) {
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception e) {
            return fallback;
        }
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
