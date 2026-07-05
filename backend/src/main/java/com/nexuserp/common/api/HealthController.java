package com.nexuserp.common.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> health() {

        Map<String, String> healthData = Map.of(
                "status", "UP",
                "service", "nexus-erp-backend"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Nexus ERP backend is running",
                        healthData
                )
        );
    }
}