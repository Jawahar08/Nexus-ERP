package com.nexuserp.user;

import com.nexuserp.security.AuthenticatedUser;
import com.nexuserp.tenant.Tenant;
import com.nexuserp.tenant.TenantRepository;
import com.nexuserp.user.dto.CreateUserRequest;
import com.nexuserp.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
public UserResponse createUserForTenant(
        AuthenticatedUser currentUser,
        CreateUserRequest request
) {

    if (currentUser.role() == UserRole.INVENTORY || currentUser.role() == UserRole.SALES) {
        throw new AccessDeniedException("User does not have permission to create users");
    }

    if (request.role() == UserRole.ADMIN && currentUser.role() != UserRole.ADMIN) {
        throw new AccessDeniedException("Only ADMIN can create ADMIN users");
    }

    UUID tenantId = currentUser.tenantId();

    Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Tenant not found"
                    )
            );

    String normalizedEmail = request.email()
            .trim()
            .toLowerCase(Locale.ROOT);

    if (userRepository
            .existsByTenantIdAndEmailIgnoreCase(
                    tenantId,
                    normalizedEmail
            )) {

        throw new IllegalArgumentException(
                "User email already exists in this tenant"
        );
    }

    User user = User.builder()
            .tenant(tenant)
            .fullName(request.fullName().trim())
            .email(normalizedEmail)
            .passwordHash(
                    passwordEncoder.encode(
                            request.password()
                    )
            )
            .role(request.role())
            .status(UserStatus.ACTIVE)
            .build();

    return UserResponse.from(
            userRepository.save(user)
    );
}

    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByTenant(UUID tenantId) {

        if (!tenantRepository.existsById(tenantId)) {
            throw new IllegalArgumentException(
                    "Tenant not found: " + tenantId
            );
        }

        return userRepository.findAllByTenantId(tenantId)
                .stream()
                .map(UserResponse::from)
                .toList();
    }
}