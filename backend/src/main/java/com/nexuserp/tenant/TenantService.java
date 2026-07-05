package com.nexuserp.tenant;

import com.nexuserp.tenant.dto.CreateTenantRequest;
import com.nexuserp.tenant.dto.TenantResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;

    @Transactional
    public TenantResponse createTenant(CreateTenantRequest request) {

        String normalizedSlug = normalizeSlug(request.slug());

        if (tenantRepository.existsBySlug(normalizedSlug)) {
            throw new IllegalArgumentException(
                    "Tenant slug already exists: " + normalizedSlug
            );
        }

        if (request.email() != null
                && !request.email().isBlank()
                && tenantRepository.existsByEmailIgnoreCase(request.email().trim())) {

            throw new IllegalArgumentException(
                    "Tenant email already exists"
            );
        }

        Tenant tenant = Tenant.builder()
                .name(request.name().trim())
                .slug(normalizedSlug)
                .email(normalizeNullable(request.email()))
                .phone(normalizeNullable(request.phone()))
                .status(TenantStatus.ACTIVE)
                .build();

        Tenant savedTenant = tenantRepository.save(tenant);

        return TenantResponse.from(savedTenant);
    }

    @Transactional(readOnly = true)
    public List<TenantResponse> getAllTenants() {
        return tenantRepository.findAll()
                .stream()
                .map(TenantResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TenantResponse getTenantById(UUID id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Tenant not found: " + id
                        )
                );

        return TenantResponse.from(tenant);
    }

    private String normalizeSlug(String slug) {
        return slug.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}