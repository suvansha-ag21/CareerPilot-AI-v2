package com.careerpilot.backend.controller;

import com.careerpilot.backend.dto.ApiResponse;
import com.careerpilot.backend.service.ResumeService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(resumeService.list(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(resumeService.get(userId, id)));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> upload(
            @AuthenticationPrincipal UUID userId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title) throws IOException {
        return ResponseEntity.ok(ApiResponse.ok(resumeService.upload(
                userId,
                file.getBytes(),
                file.getOriginalFilename(),
                file.getContentType(),
                title
        )));
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<ApiResponse<?>> analyze(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> options) {
        return ResponseEntity.ok(ApiResponse.ok(resumeService.analyze(userId, id, options)));
    }

    @RequestMapping(value = "/{id}/primary", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<?>> setPrimary(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(resumeService.setPrimary(userId, id)));
    }

    @PostMapping("/{id}/sync-skills")
    public ResponseEntity<ApiResponse<?>> syncSkills(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(resumeService.syncSkills(userId, id)));
    }

    @PostMapping("/{id}/tailor")
    public ResponseEntity<ApiResponse<?>> tailor(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(resumeService.tailor(userId, id, input)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        resumeService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("deleted", true)));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> getFile(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        byte[] bytes = resumeService.getFileBytes(userId, id);
        ByteArrayResource resource = new ByteArrayResource(bytes);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"resume.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(bytes.length)
                .body(resource);
    }
}
