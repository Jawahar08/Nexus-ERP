package com.nexuserp.auth.dto;

import com.nexuserp.user.UserRole;

import java.util.UUID;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UUID userId,
        UUID tenantId,
        String tenantSlug,
        String fullName,
        String email,
        UserRole role
) {
}