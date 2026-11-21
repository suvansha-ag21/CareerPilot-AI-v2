package com.careerpilot.backend.controller;

import com.careerpilot.backend.dto.ApiResponse;
import com.careerpilot.backend.service.SkillsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/skills")
public class SkillsController {

    private final SkillsService skillsService;

    public SkillsController(SkillsService skillsService) {
        this.skillsService = skillsService;
    }

    @GetMapping("/inventory")
    public ResponseEntity<ApiResponse<?>> getInventory(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(skillsService.getInventory(userId)));
    }

    @RequestMapping(value = "/inventory", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<?>> upsertSkill(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(skillsService.upsertSkill(userId, input)));
    }

    @DeleteMapping("/inventory/{id}")
    public ResponseEntity<ApiResponse<?>> removeSkill(
            @AuthenticationPrincipal UUID userId,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(skillsService.removeSkill(userId, id)));
    }

    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<?>> analyzeGap(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(skillsService.analyzeGap(userId, input)));
    }
}
