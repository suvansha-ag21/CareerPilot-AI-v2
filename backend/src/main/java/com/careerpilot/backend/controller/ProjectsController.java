package com.careerpilot.backend.controller;

import com.careerpilot.backend.dto.ApiResponse;
import com.careerpilot.backend.service.ProjectsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
public class ProjectsController {

    private final ProjectsService projectsService;

    public ProjectsController(ProjectsService projectsService) {
        this.projectsService = projectsService;
    }

    @GetMapping("/github")
    public ResponseEntity<ApiResponse<?>> listGitHub(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(projectsService.listGitHub(userId)));
    }

    @PostMapping("/analyze-github")
    public ResponseEntity<ApiResponse<?>> analyzeGitHub(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, String> input) {
        return ResponseEntity.ok(ApiResponse.ok(projectsService.analyzeGitHub(userId, input.get("repoUrl"))));
    }

    @DeleteMapping("/github/{id}")
    public ResponseEntity<ApiResponse<?>> deleteGitHub(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        projectsService.deleteGitHub(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("deleted", true)));
    }
}
