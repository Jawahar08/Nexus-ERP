package com.nexuserp.tenant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findBySlug(String slug);

    Optional<Tenant> findBySlugIgnoreCase(String slug);

    boolean existsBySlug(String slug);

    boolean existsByEmailIgnoreCase(String email);
}