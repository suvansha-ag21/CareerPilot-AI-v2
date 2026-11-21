package com.careerpilot.backend.controller;

import com.careerpilot.backend.dto.ApiResponse;
import com.careerpilot.backend.service.JobMatchService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/job-matches")
public class JobMatchController {

    private final JobMatchService jobMatchService;

    public JobMatchController(JobMatchService jobMatchService) {
        this.jobMatchService = jobMatchService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(jobMatchService.list(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(jobMatchService.get(userId, id)));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<?>> evaluateJson(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(jobMatchService.evaluate(userId, input, null, null)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> evaluateMultipart(
            @AuthenticationPrincipal UUID userId,
            @RequestParam("resumeId") String resumeId,
            @RequestParam(value = "targetRole", required = false) String targetRole,
            @RequestParam(value = "companyName", required = false) String companyName,
            @RequestParam(value = "experienceLevel", required = false) String experienceLevel,
            @RequestParam(value = "jobType", required = false) String jobType,
            @RequestParam(value = "jobDescription", required = false) String jobDescription,
            @RequestPart(value = "jdFile", required = false) MultipartFile jdFile) throws IOException {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("resumeId", resumeId);
        if (targetRole != null) params.put("targetRole", targetRole);
        if (companyName != null) params.put("companyName", companyName);
        if (experienceLevel != null) params.put("experienceLevel", experienceLevel);
        if (jobType != null) params.put("jobType", jobType);
        if (jobDescription != null) params.put("jobDescription", jobDescription);

        byte[] jdBytes = jdFile != null ? jdFile.getBytes() : null;
        String jdName = jdFile != null ? jdFile.getOriginalFilename() : null;

        return ResponseEntity.ok(ApiResponse.ok(jobMatchService.evaluate(userId, params, jdBytes, jdName)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        jobMatchService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("deleted", true)));
    }

    @PostMapping("/analyze-public")
    public ResponseEntity<ApiResponse<?>> analyzePublic(@RequestBody Map<String, Object> req) {
        return ResponseEntity.ok(ApiResponse.ok(jobMatchService.analyzePublic(req)));
    }
}
