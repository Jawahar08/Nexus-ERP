package com.nexuserp.config;

import com.nexuserp.tenant.Tenant;
import com.nexuserp.tenant.TenantRepository;
import com.nexuserp.tenant.TenantStatus;
import com.nexuserp.user.User;
import com.nexuserp.user.UserRepository;
import com.nexuserp.user.UserRole;
import com.nexuserp.user.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

@Component
@RequiredArgsConstructor
@Slf4j
public class SeedDataConfig implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting database auto-seeding process...");
        
        String demoSlug = "nexus-demo";
        Tenant tenant = tenantRepository.findBySlugIgnoreCase(demoSlug).orElse(null);
        
        if (tenant == null) {
            log.info("Demo tenant 'nexus-demo' not found. Creating tenant...");
            tenant = Tenant.builder()
                    .name("Nexus Demo Organization")
                    .slug(demoSlug)
                    .email("info@nexus.erp")
                    .phone("+1234567890")
                    .status(TenantStatus.ACTIVE)
                    .build();
            tenant = tenantRepository.save(tenant);
            log.info("Demo tenant 'nexus-demo' successfully created with ID: {}", tenant.getId());
        } else {
            log.info("Demo tenant 'nexus-demo' already exists.");
        }

        // Seed sandbox role profiles
        seedUser(tenant, "admin@nexus.erp", "Admin User", UserRole.ADMIN);
        seedUser(tenant, "hr@nexus.erp", "HR Manager", UserRole.HR);
        seedUser(tenant, "finance@nexus.erp", "Finance Officer", UserRole.FINANCE);
        seedUser(tenant, "sales@nexus.erp", "Sales Representative", UserRole.SALES);
        
        log.info("Database auto-seeding completed.");
    }

    private void seedUser(Tenant tenant, String email, String fullName, UserRole role) {
        if (!userRepository.existsByTenantIdAndEmailIgnoreCase(tenant.getId(), email)) {
            log.info("Seeding user profile: {} ({})", email, role);
            User user = User.builder()
                    .tenant(tenant)
                    .email(email)
                    .fullName(fullName)
                    .passwordHash(passwordEncoder.encode("password123"))
                    .role(role)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(user);
        }
    }
}
