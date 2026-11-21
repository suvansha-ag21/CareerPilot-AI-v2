package com.careerpilot.backend.controller;

import com.careerpilot.backend.dto.ApiResponse;
import com.careerpilot.backend.dto.AuthDtos.*;
import com.careerpilot.backend.service.AuthService;
import jakarta.validation.Valid;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final long refreshExpirationDays;

    public AuthController(
            AuthService authService,
            @Value("${app.jwt.refresh-expiration-days:7}") long refreshExpirationDays) {
        this.authService = authService;
        this.refreshExpirationDays = refreshExpirationDays;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest req,
            HttpServletRequest request) {
        AuthResponse res = authService.register(req);
        return withRefreshCookie(res, request);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest request) {
        AuthResponse res = authService.login(req);
        return withRefreshCookie(res, request);
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(HttpServletRequest request) {
        String refreshToken = cookieValue(request, "refreshToken");
        AuthResponse res = authService.refresh(refreshToken);
        return withRefreshCookie(res, request);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMe(@AuthenticationPrincipal UUID userId) {
        if (userId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        UserDto user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping("/onboarding")
    public ResponseEntity<ApiResponse<UserDto>> saveOnboarding(
            @AuthenticationPrincipal UUID userId,
            @RequestBody OnboardingRequest req) {
        if (userId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        UserDto user = authService.saveOnboarding(userId, req);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> forgotPassword(
            @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(authService.forgotPassword(body.get("email"))));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> resetPassword(
            @RequestBody java.util.Map<String, String> body) {
        String token = body.get("token");
        String password = body.containsKey("newPassword") ? body.get("newPassword") : body.get("password");
        return ResponseEntity.ok(ApiResponse.ok(authService.resetPassword(token, password)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletRequest request) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie("", request, Duration.ZERO).toString())
                .body(ApiResponse.ok("Logged out successfully"));
    }

    private ResponseEntity<ApiResponse<AuthResponse>> withRefreshCookie(
            AuthResponse response, HttpServletRequest request) {
        String refreshToken = authService.createRefreshToken(UUID.fromString(response.getUser().getId()));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(
                        refreshToken, request, Duration.ofDays(refreshExpirationDays)).toString())
                .body(ApiResponse.ok(response));
    }

    private ResponseCookie refreshCookie(String value, HttpServletRequest request, Duration maxAge) {
        boolean secure = request.isSecure()
                || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
        return ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(secure ? "None" : "Lax")
                .path("/api/auth")
                .maxAge(maxAge)
                .build();
    }

    private String cookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
