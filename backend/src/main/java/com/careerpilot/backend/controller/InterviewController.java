package com.careerpilot.backend.controller;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.dto.ApiResponse;
import com.careerpilot.backend.service.InterviewSessionService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final AiServiceClient aiServiceClient;
    private final InterviewSessionService interviewSessionService;

    public InterviewController(
            AiServiceClient aiServiceClient,
            InterviewSessionService interviewSessionService) {
        this.aiServiceClient = aiServiceClient;
        this.interviewSessionService = interviewSessionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(interviewSessionService.list(userId)));
    }

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<?>> start(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(interviewSessionService.start(userId, input)));
    }

    @PostMapping("/{sessionId}/answer")
    public ResponseEntity<ApiResponse<?>> submitAnswer(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(interviewSessionService.submitAnswer(userId, sessionId, input)));
    }

    @PostMapping(value = "/{sessionId}/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> transcribe(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId,
            @RequestPart("audio") MultipartFile audio,
            @RequestParam(defaultValue = "0") double durationSeconds) throws IOException {
        return ResponseEntity.ok(ApiResponse.ok(interviewSessionService.transcribeAudio(
                userId,
                sessionId,
                audio.getBytes(),
                audio.getOriginalFilename() == null ? "answer.webm" : audio.getOriginalFilename(),
                audio.getContentType() == null ? "audio/webm" : audio.getContentType(),
                durationSeconds)));
    }

    @PostMapping(value = "/{sessionId}/answer-voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> submitVoiceAnswer(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId,
            @RequestPart("audio") MultipartFile audio,
            @RequestParam String questionId,
            @RequestParam(defaultValue = "0") double durationSeconds) throws IOException {
        return ResponseEntity.ok(ApiResponse.ok(interviewSessionService.submitVoiceAnswer(
                userId,
                sessionId,
                questionId,
                audio.getBytes(),
                audio.getOriginalFilename() == null ? "answer.webm" : audio.getOriginalFilename(),
                audio.getContentType() == null ? "audio/webm" : audio.getContentType(),
                durationSeconds)));
    }

    @PostMapping(value = "/{sessionId}/hint-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamHint(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId,
            @RequestBody Map<String, Object> input) {
        return interviewSessionService.streamHint(userId, sessionId, String.valueOf(input.get("questionId")));
    }

    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<ApiResponse<?>> complete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(interviewSessionService.complete(userId, sessionId)));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<?>> get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(interviewSessionService.get(userId, sessionId)));
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<?>> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId) {
        interviewSessionService.delete(userId, sessionId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("deleted", true)));
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
