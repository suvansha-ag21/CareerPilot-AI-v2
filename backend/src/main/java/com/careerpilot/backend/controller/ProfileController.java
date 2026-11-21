package com.careerpilot.backend.controller;

import com.careerpilot.backend.dto.ApiResponse;
import com.careerpilot.backend.dto.AuthDtos.UserDto;
import com.careerpilot.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final AuthService authService;

    public ProfileController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserDto>> getProfile(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(authService.getCurrentUser(userId)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(authService.updateProfile(userId, input)));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<UserDto>> patchProfile(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, Object> input) {
        return ResponseEntity.ok(ApiResponse.ok(authService.updateProfile(userId, input)));
    }
}
