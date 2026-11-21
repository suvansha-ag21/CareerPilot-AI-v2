package com.careerpilot.backend.controller;

import com.careerpilot.backend.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("readinessScore", null);
        d.put("latestResumeScore", null);
        d.put("latestJobMatchScore", null);
        d.put("totalMockInterviews", 0);
        d.put("averageInterviewScore", null);
        d.put("skillsCount", 0);
        d.put("roadmapProgressPct", null);
        d.put("applicationStats", Map.of("total", 0, "active", 0, "interviewsScheduled", 0, "offersReceived", 0));
        d.put("profileCompletenessPct", 20);
        d.put("serviceHealth", Map.of("database", "healthy", "aiService", "healthy"));
        d.put("recentActivities", Collections.emptyList());
        d.put("upcomingInterviews", Collections.emptyList());
        d.put("recommendations", Collections.emptyList());

        return ResponseEntity.ok(ApiResponse.ok(d));
    }
}
