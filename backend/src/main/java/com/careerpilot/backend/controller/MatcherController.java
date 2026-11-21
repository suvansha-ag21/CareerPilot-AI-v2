package com.careerpilot.backend.controller;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/matcher")
public class MatcherController {

    private final AiServiceClient aiServiceClient;

    public MatcherController(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    @PostMapping("/analyze-public")
    public ResponseEntity<ApiResponse<Map>> analyzePublic(@RequestBody Map<String, Object> req) {
        Map res = aiServiceClient.matchJob(req).block();
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PostMapping("/match")
    public ResponseEntity<ApiResponse<Map>> matchJob(@RequestBody Map<String, Object> req) {
        Map res = aiServiceClient.matchJob(req).block();
        return ResponseEntity.ok(ApiResponse.ok(res));
    }
}
