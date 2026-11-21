package com.careerpilot.backend.controller;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final AiServiceClient aiServiceClient;

    public InterviewController(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    @PostMapping("/question")
    public ResponseEntity<ApiResponse<Map>> getQuestion(@RequestBody Map<String, Object> req) {
        Map res = aiServiceClient.generateInterviewQuestion(req).block();
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse<Map>> evaluateAnswer(@RequestBody Map<String, Object> req) {
        Map res = aiServiceClient.evaluateInterviewAnswer(req).block();
        return ResponseEntity.ok(ApiResponse.ok(res));
    }
}
