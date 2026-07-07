package com.nexuserp.security;

import com.nexuserp.user.UserRole;

import java.util.UUID;

public record AuthenticatedUser(
        UUID userId,
        UUID tenantId,
        String email,
        UserRole role
) {
}