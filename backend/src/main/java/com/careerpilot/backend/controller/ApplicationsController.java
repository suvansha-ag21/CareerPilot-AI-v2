package com.careerpilot.backend.controller;

import com.careerpilot.backend.dto.ApiResponse;
import com.careerpilot.backend.service.ApplicationsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
public class ApplicationsController {

    private final ApplicationsService applicationsService;

    public ApplicationsController(ApplicationsService applicationsService) {
        this.applicationsService = applicationsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String jobType,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok(applicationsService.list(userId, status, jobType, search)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(applicationsService.create(userId, input)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(applicationsService.get(userId, id)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(applicationsService.update(userId, id, input)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        applicationsService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("deleted", true)));
    }
}
