package com.careerpilot.backend.service;

import com.careerpilot.backend.entity.JobApplicationRecord;
import com.careerpilot.backend.repository.JobApplicationRecordRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

@Service
public class ApplicationsService {

    private final JobApplicationRecordRepository repository;
    private final ObjectMapper objectMapper;

    public ApplicationsService(JobApplicationRecordRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> list(UUID userId, String status, String jobType, String search) {
        List<JobApplicationRecord> records = repository.findAllByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        String cleanSearch = search != null ? search.trim().toLowerCase() : null;

        for (JobApplicationRecord record : records) {
            Map<String, Object> item = readData(record);
            if (status != null && !status.equalsIgnoreCase("ALL") && !status.equalsIgnoreCase(String.valueOf(item.get("status")))) {
                continue;
            }
            if (jobType != null && !jobType.equalsIgnoreCase("ALL") && !jobType.equalsIgnoreCase(String.valueOf(item.get("jobType")))) {
                continue;
            }
            if (cleanSearch != null && !cleanSearch.isEmpty()) {
                String comp = String.valueOf(item.getOrDefault("company", "")).toLowerCase();
                String role = String.valueOf(item.getOrDefault("jobRole", "")).toLowerCase();
                if (!comp.contains(cleanSearch) && !role.contains(cleanSearch)) {
                    continue;
                }
            }
            result.add(item);
        }
        return result;
    }

    public Map<String, Object> get(UUID userId, UUID id) {
        JobApplicationRecord record = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job application not found"));
        return readData(record);
    }

    public Map<String, Object> create(UUID userId, Map<String, Object> input) {
        String company = String.valueOf(input.getOrDefault("company", "")).trim();
        String jobRole = String.valueOf(input.getOrDefault("jobRole", "")).trim();
        if (company.isEmpty() || jobRole.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company and job role are required");
        }

        JobApplicationRecord record = new JobApplicationRecord();
        record.setUserId(userId);
        record.setRecordData("{}");
        record = repository.save(record);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", record.getId().toString());
        data.put("userId", userId.toString());
        data.put("company", company);
        data.put("jobRole", jobRole);
        data.put("jobType", input.getOrDefault("jobType", "FULL_TIME"));
        data.put("jobDescription", input.get("jobDescription"));
        data.put("status", input.getOrDefault("status", "APPLIED"));
        data.put("applicationDate", input.containsKey("applicationDate") && input.get("applicationDate") != null
                ? String.valueOf(input.get("applicationDate"))
                : Instant.now().toString());
        data.put("interviewDate", input.get("interviewDate"));
        data.put("applicationUrl", input.get("applicationUrl"));
        data.put("notes", input.get("notes"));
        data.put("createdAt", Instant.now().toString());
        data.put("updatedAt", Instant.now().toString());

        record.setRecordData(writeData(data));
        repository.save(record);
        return data;
    }

    public Map<String, Object> update(UUID userId, UUID id, Map<String, Object> input) {
        JobApplicationRecord record = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job application not found"));

        Map<String, Object> data = readData(record);
        for (String field : List.of("company", "jobRole", "jobType", "jobDescription", "status",
                "applicationDate", "interviewDate", "applicationUrl", "notes")) {
            if (input.containsKey(field)) {
                data.put(field, input.get(field));
            }
        }
        data.put("updatedAt", Instant.now().toString());
        record.setRecordData(writeData(data));
        repository.save(record);
        return data;
    }

    public void delete(UUID userId, UUID id) {
        JobApplicationRecord record = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job application not found"));
        repository.delete(record);
    }

    private Map<String, Object> readData(JobApplicationRecord record) {
        try {
            Map<String, Object> data = objectMapper.readValue(record.getRecordData(), new TypeReference<>() {});
            data.put("id", record.getId().toString());
            data.put("userId", record.getUserId().toString());
            if (record.getCreatedAt() != null && !data.containsKey("createdAt")) {
                data.put("createdAt", record.getCreatedAt().toString());
            }
            if (record.getUpdatedAt() != null && !data.containsKey("updatedAt")) {
                data.put("updatedAt", record.getUpdatedAt().toString());
            }
            return data;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse application record data", e);
        }
    }

    private String writeData(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize application record data", e);
        }
    }
}
