package com.nexuserp.auth;

import com.nexuserp.auth.dto.LoginRequest;
import com.nexuserp.auth.dto.LoginResponse;
import com.nexuserp.security.JwtService;
import com.nexuserp.tenant.Tenant;
import com.nexuserp.tenant.TenantRepository;
import com.nexuserp.user.User;
import com.nexuserp.user.UserRepository;
import com.nexuserp.user.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        String normalizedSlug = request.tenantSlug()
                .trim()
                .toLowerCase(Locale.ROOT);

        String normalizedEmail = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        Tenant tenant = tenantRepository
                .findBySlugIgnoreCase(normalizedSlug)
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid credentials")
                );

        User user = userRepository
                .findByTenantIdAndEmailIgnoreCase(
                        tenant.getId(),
                        normalizedEmail
                )
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid credentials")
                );

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        )) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String accessToken = jwtService.generateAccessToken(user);

        return new LoginResponse(
                accessToken,
                "Bearer",
                jwtService.getAccessTokenExpirationMs() / 1000,
                user.getId(),
                tenant.getId(),
                tenant.getSlug(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }
}