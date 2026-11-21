package com.careerpilot.backend.controller;

import com.careerpilot.backend.dto.ApiResponse;
import com.careerpilot.backend.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getDashboardAnalytics(userId)));
    }

    @GetMapping("/detailed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDetailed(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getDetailedAnalytics(userId)));
    }
}
