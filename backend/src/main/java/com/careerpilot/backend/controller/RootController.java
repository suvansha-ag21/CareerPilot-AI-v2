package com.careerpilot.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("service", "CareerPilot Backend API");
        info.put("status", "running");
        info.put("health", "/api/health");
        info.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(info);
    }
}
