package com.nexuserp.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByTenantIdAndEmailIgnoreCase(
            UUID tenantId,
            String email
    );

    boolean existsByTenantIdAndEmailIgnoreCase(
            UUID tenantId,
            String email
    );

    List<User> findAllByTenantId(UUID tenantId);
}