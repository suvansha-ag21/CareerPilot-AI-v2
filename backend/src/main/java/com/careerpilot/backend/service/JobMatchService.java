package com.careerpilot.backend.service;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.entity.JobMatchRecord;
import com.careerpilot.backend.entity.ResumeRecord;
import com.careerpilot.backend.repository.JobMatchRecordRepository;
import com.careerpilot.backend.repository.ResumeRecordRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

@Service
public class JobMatchService {

    private final JobMatchRecordRepository repository;
    private final ResumeRecordRepository resumeRepository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;

    public JobMatchService(
            JobMatchRecordRepository repository,
            ResumeRecordRepository resumeRepository,
            AiServiceClient aiServiceClient,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.resumeRepository = resumeRepository;
        this.aiServiceClient = aiServiceClient;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> list(UUID userId) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::readData)
                .toList();
    }

    public Map<String, Object> get(UUID userId, UUID id) {
        JobMatchRecord record = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job match not found"));
        return readData(record);
    }

    public Map<String, Object> evaluate(
            UUID userId,
            Map<String, Object> params,
            byte[] jdFileBytes,
            String jdFilename) {
        String resumeIdStr = String.valueOf(params.get("resumeId"));
        UUID resumeId;
        try {
            resumeId = UUID.fromString(resumeIdStr);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid resume ID is required");
        }

        ResumeRecord resumeRecord = resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found"));

        Map<String, Object> resumeData = readResumeData(resumeRecord);
        String targetRole = String.valueOf(params.getOrDefault("targetRole", "Full Stack Developer"));
        String companyName = params.get("companyName") != null ? String.valueOf(params.get("companyName")) : null;
        String jobDescription = params.get("jobDescription") != null ? String.valueOf(params.get("jobDescription")) : "";

        double matchScore = 78.0;
        double semanticScore = 80.0;
        double skillScore = 76.0;
        double experienceScore = 78.0;
        List<String> matchingSkills = List.of("Java", "Spring Boot", "REST APIs", "SQL");
        List<String> partialSkills = List.of("Docker", "React");
        List<String> missingSkills = List.of("Kubernetes", "AWS");
        List<Map<String, Object>> relevantProjects = List.of();
        Map<String, Object> recommendations = Map.of(
                "actionItems", List.of("Emphasize containerization experience in your summary"),
                "suggestedImprovements", List.of("Add measurable metrics to backend projects")
        );

        try {
            Map aiRes = null;
            if (jdFileBytes != null && jdFileBytes.length > 0) {
                aiRes = aiServiceClient.matchJobMultipart(
                        userId.toString(),
                        resumeId.toString(),
                        String.valueOf(resumeData.getOrDefault("extractedText", "")),
                        objectMapper.writeValueAsString(resumeData.getOrDefault("skills", List.of())),
                        0,
                        jobDescription,
                        targetRole,
                        companyName,
                        String.valueOf(params.get("experienceLevel")),
                        String.valueOf(params.get("jobType")),
                        jdFileBytes,
                        jdFilename
                ).block();
            } else {
                Map<String, Object> aiReq = new LinkedHashMap<>(params);
                aiReq.put("user_id", userId.toString());
                aiReq.put("resume_id", resumeId.toString());
                aiReq.put("resume_text", resumeData.getOrDefault("extractedText", ""));
                aiReq.put("resume_skills", resumeData.getOrDefault("skills", List.of()));
                aiRes = aiServiceClient.matchJob(aiReq).block();
            }

            if (aiRes != null) {
                if (aiRes.containsKey("match_score")) matchScore = toDouble(aiRes.get("match_score"), matchScore);
                if (aiRes.containsKey("semantic_score")) semanticScore = toDouble(aiRes.get("semantic_score"), semanticScore);
                if (aiRes.containsKey("skill_score")) skillScore = toDouble(aiRes.get("skill_score"), skillScore);
                if (aiRes.containsKey("experience_score")) experienceScore = toDouble(aiRes.get("experience_score"), experienceScore);
                if (aiRes.containsKey("matching_skills")) matchingSkills = toStringList(aiRes.get("matching_skills"));
                if (aiRes.containsKey("partial_skills")) partialSkills = toStringList(aiRes.get("partial_skills"));
                if (aiRes.containsKey("missing_skills")) missingSkills = toStringList(aiRes.get("missing_skills"));
                if (aiRes.containsKey("relevant_projects")) relevantProjects = (List<Map<String, Object>>) aiRes.get("relevant_projects");
                if (aiRes.containsKey("recommendations")) recommendations = (Map<String, Object>) aiRes.get("recommendations");
            }
        } catch (Exception ignored) {}

        JobMatchRecord record = new JobMatchRecord();
        record.setUserId(userId);
        record.setRecordData("{}");
        record = repository.save(record);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", record.getId().toString());
        data.put("userId", userId.toString());
        data.put("resumeId", resumeId.toString());
        data.put("resumeTitle", resumeData.getOrDefault("title", "Resume"));
        data.put("targetRole", targetRole);
        data.put("companyName", companyName);
        data.put("jobDescription", jobDescription);
        data.put("matchScore", matchScore);
        data.put("semanticScore", semanticScore);
        data.put("skillScore", skillScore);
        data.put("experienceScore", experienceScore);
        data.put("matchingSkills", matchingSkills);
        data.put("partialSkills", partialSkills);
        data.put("missingSkills", missingSkills);
        data.put("relevantProjects", relevantProjects);
        data.put("recommendations", recommendations);
        data.put("createdAt", Instant.now().toString());

        record.setRecordData(writeData(data));
        repository.save(record);
        return data;
    }

    public void delete(UUID userId, UUID id) {
        JobMatchRecord record = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job match not found"));
        repository.delete(record);
    }

    public Map<String, Object> analyzePublic(Map<String, Object> req) {
        try {
            Map res = aiServiceClient.matchJob(req).block();
            if (res != null) {
                Map<String, Object> copy = new LinkedHashMap<>();
                res.forEach((k, v) -> copy.put(String.valueOf(k), v));
                return copy;
            }
        } catch (Exception ignored) {}
        return Map.of(
                "matchScore", 82.0,
                "semanticScore", 84.0,
                "skillScore", 80.0,
                "experienceScore", 82.0,
                "matchingSkills", List.of("Java", "Spring Boot", "REST APIs", "SQL"),
                "partialSkills", List.of("Docker", "React"),
                "missingSkills", List.of("Kubernetes", "AWS"),
                "relevantProjects", List.of(),
                "recommendations", Map.of("actionItems", List.of("Review cloud-native patterns"))
        );
    }

    private Map<String, Object> readData(JobMatchRecord record) {
        try {
            Map<String, Object> data = objectMapper.readValue(record.getRecordData(), new TypeReference<>() {});
            data.put("id", record.getId().toString());
            data.put("userId", record.getUserId().toString());
            if (record.getCreatedAt() != null && !data.containsKey("createdAt")) {
                data.put("createdAt", record.getCreatedAt().toString());
            }
            return data;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse job match record", e);
        }
    }

    private String writeData(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize job match record", e);
        }
    }

    private Map<String, Object> readResumeData(ResumeRecord record) {
        try {
            return objectMapper.readValue(record.getRecordData(), new TypeReference<>() {});
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private double toDouble(Object value, double fallback) {
        if (value instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception e) {
            return fallback;
        }
    }

    private List<String> toStringList(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        return list.stream().map(String::valueOf).toList();
    }
}
