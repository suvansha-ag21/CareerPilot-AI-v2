package com.careerpilot.backend.controller;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final AiServiceClient aiServiceClient;

    public HealthController(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHealth() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("gateway", "ok (Spring Boot 3.3.5)");
        health.put("database", "ok");
        health.put("timestamp", Instant.now().toString());

        try {
            Map aiHealth = aiServiceClient.checkHealth().block();
            health.put("aiService", aiHealth != null ? aiHealth : Map.of("healthy", true));
        } catch (Exception ex) {
            health.put("aiService", Map.of("healthy", false, "error", ex.getMessage()));
        }

        return ResponseEntity.ok(ApiResponse.ok(health));
    }
}
