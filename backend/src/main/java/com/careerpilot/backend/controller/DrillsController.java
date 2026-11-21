package com.careerpilot.backend.controller;

import com.careerpilot.backend.dto.ApiResponse;
import com.careerpilot.backend.service.DrillsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/drills")
public class DrillsController {

    private final DrillsService drillsService;

    public DrillsController(DrillsService drillsService) {
        this.drillsService = drillsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(drillsService.list(userId)));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<?>> generate(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(drillsService.generate(userId, input)));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<ApiResponse<?>> review(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> input) {
        int rating = 4;
        if (input.containsKey("rating") && input.get("rating") instanceof Number n) {
            rating = n.intValue();
        }
        return ResponseEntity.ok(ApiResponse.ok(drillsService.review(userId, id, rating)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        drillsService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("deleted", true)));
    }
}
