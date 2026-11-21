package com.careerpilot.backend.service;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.entity.RoadmapRecord;
import com.careerpilot.backend.repository.RoadmapRecordRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

@Service
public class RoadmapService {

    private final RoadmapRecordRepository repository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;

    public RoadmapService(
            RoadmapRecordRepository repository,
            AiServiceClient aiServiceClient,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.aiServiceClient = aiServiceClient;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> list(UUID userId) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::readData)
                .toList();
    }

    public Map<String, Object> get(UUID userId, UUID id) {
        RoadmapRecord record = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Roadmap not found"));
        return readData(record);
    }

    public Map<String, Object> generate(UUID userId, Map<String, Object> input) {
        String targetRole = String.valueOf(input.getOrDefault("targetRole", "Full Stack Developer")).trim();
        int estimatedWeeks = 4;
        if (input.containsKey("estimatedWeeks") && input.get("estimatedWeeks") instanceof Number n) {
            estimatedWeeks = n.intValue();
        }

        List<Map<String, Object>> tasks = new ArrayList<>();
        String title = targetRole + " Mastery Sprint";

        try {
            Map<String, Object> aiReq = new LinkedHashMap<>(input);
            aiReq.put("user_id", userId.toString());
            aiReq.put("target_role", targetRole);
            Map aiRes = aiServiceClient.generateRoadmap(aiReq).block();
            if (aiRes != null && aiRes.containsKey("tasks") && aiRes.get("tasks") instanceof List<?> list) {
                list.forEach(t -> {
                    if (t instanceof Map<?, ?> m) {
                        Map<String, Object> taskMap = new LinkedHashMap<>();
                        m.forEach((k, v) -> taskMap.put(String.valueOf(k), v));
                        if (!taskMap.containsKey("id")) taskMap.put("id", UUID.randomUUID().toString());
                        if (!taskMap.containsKey("status")) taskMap.put("status", "PENDING");
                        tasks.add(taskMap);
                    }
                });
            }
        } catch (Exception ignored) {}

        if (tasks.isEmpty()) {
            // Default curriculum sprint
            tasks.addAll(createDefaultSprintTasks(targetRole, estimatedWeeks));
        }

        // Deactivate previous active roadmaps
        List<RoadmapRecord> all = repository.findAllByUserIdOrderByCreatedAtDesc(userId);
        for (RoadmapRecord rec : all) {
            Map<String, Object> d = readData(rec);
            d.put("isActive", false);
            rec.setRecordData(writeData(d));
            repository.save(rec);
        }

        RoadmapRecord record = new RoadmapRecord();
        record.setUserId(userId);
        record.setRecordData("{}");
        record = repository.save(record);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", record.getId().toString());
        data.put("userId", userId.toString());
        data.put("targetRole", targetRole);
        data.put("title", title);
        data.put("estimatedWeeks", estimatedWeeks);
        data.put("progressPct", 0.0);
        data.put("isActive", true);
        data.put("totalTasks", tasks.size());
        data.put("completedTasks", 0);
        data.put("inProgressTasks", 0);
        data.put("tasks", tasks);
        data.put("createdAt", Instant.now().toString());
        data.put("updatedAt", Instant.now().toString());

        record.setRecordData(writeData(data));
        repository.save(record);
        return data;
    }

    public Map<String, Object> activate(UUID userId, UUID id) {
        List<RoadmapRecord> all = repository.findAllByUserIdOrderByCreatedAtDesc(userId);
        Map<String, Object> activated = null;

        for (RoadmapRecord rec : all) {
            Map<String, Object> d = readData(rec);
            boolean isTarget = rec.getId().equals(id);
            d.put("isActive", isTarget);
            d.put("updatedAt", Instant.now().toString());
            rec.setRecordData(writeData(d));
            repository.save(rec);
            if (isTarget) activated = d;
        }

        if (activated == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Roadmap not found");
        }
        return activated;
    }

    public Map<String, Object> updateTask(UUID userId, UUID id, String taskId, Map<String, Object> input) {
        RoadmapRecord record = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Roadmap not found"));

        Map<String, Object> data = readData(record);
        List<Map<String, Object>> tasks = (List<Map<String, Object>>) data.getOrDefault("tasks", new ArrayList<>());

        boolean found = false;
        int completed = 0;
        int inProgress = 0;

        for (Map<String, Object> task : tasks) {
            if (taskId.equals(String.valueOf(task.get("id")))) {
                found = true;
                if (input.containsKey("status")) {
                    String status = String.valueOf(input.get("status"));
                    task.put("status", status);
                    if ("COMPLETED".equals(status)) {
                        task.put("completedAt", Instant.now().toString());
                    } else {
                        task.put("completedAt", null);
                    }
                }
            }
            String st = String.valueOf(task.get("status"));
            if ("COMPLETED".equals(st)) completed++;
            else if ("IN_PROGRESS".equals(st)) inProgress++;
        }

        if (!found) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found in roadmap");
        }

        double pct = tasks.isEmpty() ? 0 : Math.round(((double) completed / tasks.size()) * 1000.0) / 10.0;
        data.put("completedTasks", completed);
        data.put("inProgressTasks", inProgress);
        data.put("progressPct", pct);
        data.put("updatedAt", Instant.now().toString());

        record.setRecordData(writeData(data));
        repository.save(record);
        return data;
    }

    public void delete(UUID userId, UUID id) {
        RoadmapRecord record = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Roadmap not found"));
        repository.delete(record);
    }

    private List<Map<String, Object>> createDefaultSprintTasks(String role, int weeks) {
        List<Map<String, Object>> list = new ArrayList<>();
        list.add(createTask(1, 1, "Core Architecture Fundamentals", "Review thread concurrency, data structures, and system design patterns.", "Core CS", "HIGH"));
        list.add(createTask(1, 3, "Database Optimization & Indexing", "Study B-tree indexing, query execution plans, and transaction isolation levels.", "Databases", "HIGH"));
        list.add(createTask(2, 1, "REST & Microservice Patterns", "Implement circuit breaker, idempotency, and distributed rate limiting.", "Backend", "MEDIUM"));
        list.add(createTask(2, 4, "Security & Auth Best Practices", "Review OAuth2, JWT lifecycle, RBAC, and OWASP Top 10 mitigations.", "Security", "HIGH"));
        list.add(createTask(3, 2, "Containerization & CI/CD Pipelines", "Containerize fullstack application with multi-stage Docker and automated tests.", "DevOps", "MEDIUM"));
        list.add(createTask(4, 1, "Mock Interview Simulations", "Complete 3 comprehensive mock interview sessions under timed constraints.", "Interviews", "HIGH"));
        return list;
    }

    private Map<String, Object> createTask(int week, int day, String title, String desc, String tag, String priority) {
        Map<String, Object> t = new LinkedHashMap<>();
        t.put("id", UUID.randomUUID().toString());
        t.put("weekNumber", week);
        t.put("dayNumber", day);
        t.put("title", title);
        t.put("description", desc);
        t.put("skillTag", tag);
        t.put("priority", priority);
        t.put("resources", List.of(Map.of("title", "Official Documentation & Guides", "url", "https://docs.oracle.com")));
        t.put("status", "PENDING");
        t.put("dueDate", null);
        t.put("completedAt", null);
        return t;
    }

    private Map<String, Object> readData(RoadmapRecord record) {
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
            throw new IllegalStateException("Failed to parse roadmap record", e);
        }
    }

    private String writeData(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize roadmap record", e);
        }
    }
}
