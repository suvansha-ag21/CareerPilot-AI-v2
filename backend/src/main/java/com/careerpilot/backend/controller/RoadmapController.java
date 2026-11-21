package com.careerpilot.backend.controller;

import com.careerpilot.backend.dto.ApiResponse;
import com.careerpilot.backend.service.RoadmapService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/roadmaps")
public class RoadmapController {

    private final RoadmapService roadmapService;

    public RoadmapController(RoadmapService roadmapService) {
        this.roadmapService = roadmapService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(roadmapService.list(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(roadmapService.get(userId, id)));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<?>> generate(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(roadmapService.generate(userId, input)));
    }

    @RequestMapping(value = "/{id}/activate", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<?>> activate(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(roadmapService.activate(userId, id)));
    }

    @PatchMapping("/{id}/tasks/{taskId}")
    public ResponseEntity<ApiResponse<?>> updateTask(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @PathVariable String taskId,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(roadmapService.updateTask(userId, id, taskId, input)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        roadmapService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("deleted", true)));
    }
}
