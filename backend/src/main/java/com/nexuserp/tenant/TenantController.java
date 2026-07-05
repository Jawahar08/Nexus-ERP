package com.nexuserp.tenant;

import com.nexuserp.common.api.ApiResponse;
import com.nexuserp.tenant.dto.CreateTenantRequest;
import com.nexuserp.tenant.dto.TenantResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    public ResponseEntity<ApiResponse<TenantResponse>> createTenant(
            @Valid @RequestBody CreateTenantRequest request
    ) {

        TenantResponse tenant = tenantService.createTenant(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Tenant created successfully",
                                tenant
                        )
                );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TenantResponse>>> getAllTenants() {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Tenants retrieved successfully",
                        tenantService.getAllTenants()
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TenantResponse>> getTenantById(
            @PathVariable UUID id
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Tenant retrieved successfully",
                        tenantService.getTenantById(id)
                )
        );
    }
}