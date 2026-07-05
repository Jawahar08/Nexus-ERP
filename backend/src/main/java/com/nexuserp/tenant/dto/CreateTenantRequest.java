package com.nexuserp.tenant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTenantRequest(

        @NotBlank(message = "Tenant name is required")
        @Size(max = 150, message = "Tenant name must not exceed 150 characters")
        String name,

        @NotBlank(message = "Tenant slug is required")
        @Size(max = 100, message = "Tenant slug must not exceed 100 characters")
        String slug,

        @Email(message = "Email must be valid")
        @Size(max = 150, message = "Email must not exceed 150 characters")
        String email,

        @Size(max = 30, message = "Phone must not exceed 30 characters")
        String phone
) {
}