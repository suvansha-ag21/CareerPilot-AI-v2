package com.careerpilot.backend.service;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.entity.FlashcardDrillRecord;
import com.careerpilot.backend.repository.FlashcardDrillRecordRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class DrillsService {

    private final FlashcardDrillRecordRepository repository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;

    public DrillsService(
            FlashcardDrillRecordRepository repository,
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

    public List<Map<String, Object>> generate(UUID userId, Map<String, Object> input) {
        String topic = String.valueOf(input.getOrDefault("topic", "System Design & Concurrency")).trim();
        int count = 3;
        if (input.containsKey("count") && input.get("count") instanceof Number n) {
            count = Math.max(1, Math.min(10, n.intValue()));
        }

        List<Map<String, Object>> generatedCards = new ArrayList<>();
        try {
            Map<String, Object> aiReq = new LinkedHashMap<>(input);
            aiReq.put("user_id", userId.toString());
            aiReq.put("topic", topic);
            aiReq.put("count", count);
            Map aiRes = aiServiceClient.generateDrills(aiReq).block();
            if (aiRes != null && aiRes.containsKey("drills") && aiRes.get("drills") instanceof List<?> list) {
                list.forEach(item -> {
                    if (item instanceof Map<?, ?> m) {
                        Map<String, Object> card = new LinkedHashMap<>();
                        m.forEach((k, v) -> card.put(String.valueOf(k), v));
                        generatedCards.add(card);
                    }
                });
            }
        } catch (Exception ignored) {}

        if (generatedCards.isEmpty()) {
            generatedCards.addAll(getDefaultDrills(topic));
        }

        List<Map<String, Object>> savedResults = new ArrayList<>();
        for (Map<String, Object> card : generatedCards) {
            FlashcardDrillRecord record = new FlashcardDrillRecord();
            record.setUserId(userId);
            record.setRecordData("{}");
            record = repository.save(record);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("id", record.getId().toString());
            data.put("userId", userId.toString());
            data.put("topic", card.getOrDefault("topic", topic));
            data.put("question", card.get("question"));
            data.put("hint", card.get("hint"));
            data.put("modelAnswer", card.get("modelAnswer"));
            data.put("source", "AI_GENERATED");
            data.put("easeFactor", 2.5);
            data.put("intervalDays", 1);
            data.put("repetitions", 0);
            data.put("nextReviewAt", Instant.now().toString());
            data.put("lastReviewedAt", null);
            data.put("createdAt", Instant.now().toString());

            record.setRecordData(writeData(data));
            repository.save(record);
            savedResults.add(data);
        }

        return savedResults;
    }

    public Map<String, Object> review(UUID userId, UUID id, int rating) {
        FlashcardDrillRecord record = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Drill not found"));

        Map<String, Object> data = readData(record);
        int q = Math.max(0, Math.min(5, rating)); // Quality rating 0 to 5

        double ef = toDouble(data.get("easeFactor"), 2.5);
        int reps = toInt(data.get("repetitions"), 0);
        int interval = toInt(data.get("intervalDays"), 1);

        // SM-2 Spaced Repetition Algorithm
        if (q >= 3) {
            if (reps == 0) {
                interval = 1;
            } else if (reps == 1) {
                interval = 6;
            } else {
                interval = (int) Math.round(interval * ef);
            }
            reps++;
        } else {
            reps = 0;
            interval = 1;
        }

        ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        if (ef < 1.3) ef = 1.3;

        Instant next = Instant.now().plus(interval, ChronoUnit.DAYS);

        data.put("easeFactor", Math.round(ef * 100.0) / 100.0);
        data.put("repetitions", reps);
        data.put("intervalDays", interval);
        data.put("nextReviewAt", next.toString());
        data.put("lastReviewedAt", Instant.now().toString());

        record.setRecordData(writeData(data));
        repository.save(record);
        return data;
    }

    public void delete(UUID userId, UUID id) {
        FlashcardDrillRecord record = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Drill not found"));
        repository.delete(record);
    }

    private List<Map<String, Object>> getDefaultDrills(String topic) {
        return List.of(
                Map.of(
                        "topic", topic,
                        "question", "What is the difference between optimistic and pessimistic locking in databases?",
                        "hint", "Consider conflict frequency and version checking.",
                        "modelAnswer", "Optimistic locking assumes conflicts are rare and verifies record versions on commit. Pessimistic locking acquires exclusive locks upfront (e.g. SELECT FOR UPDATE) preventing concurrent modifications."
                ),
                Map.of(
                        "topic", topic,
                        "question", "How does the CAP theorem apply to distributed storage design?",
                        "hint", "Consistency, Availability, Partition tolerance.",
                        "modelAnswer", "Under a network partition, a distributed system must choose between Consistency (returning current data or erroring) and Availability (returning available, possibly stale data)."
                ),
                Map.of(
                        "topic", topic,
                        "question", "Why do B+ trees outperform binary search trees for disk-based databases?",
                        "hint", "Block I/O and branching factor.",
                        "modelAnswer", "B+ trees have a high fan-out/branching factor, minimizing disk I/O depth. All data resides in linked leaf nodes, enabling rapid sequential scans."
                )
        );
    }

    private Map<String, Object> readData(FlashcardDrillRecord record) {
        try {
            Map<String, Object> data = objectMapper.readValue(record.getRecordData(), new TypeReference<>() {});
            data.put("id", record.getId().toString());
            data.put("userId", record.getUserId().toString());
            if (record.getCreatedAt() != null && !data.containsKey("createdAt")) {
                data.put("createdAt", record.getCreatedAt().toString());
            }
            return data;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse drill record", e);
        }
    }

    private String writeData(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize drill record", e);
        }
    }

    private double toDouble(Object val, double fallback) {
        if (val instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(val));
        } catch (Exception e) {
            return fallback;
        }
    }

    private int toInt(Object val, int fallback) {
        if (val instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(val));
        } catch (Exception e) {
            return fallback;
        }
    }
}
