package com.nexuserp.security;

import com.nexuserp.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiration-ms}")
            long accessTokenExpirationMs
    ) {
        if (secret == null
                || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException(
                    "JWT secret must be at least 32 bytes"
            );
        }

        this.signingKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );

        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    public String generateAccessToken(User user) {

        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(accessTokenExpirationMs);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim(
                        "tenantId",
                        user.getTenant().getId().toString()
                )
                .claim(
                        "tenantSlug",
                        user.getTenant().getSlug()
                )
                .claim(
                        "email",
                        user.getEmail()
                )
                .claim(
                        "role",
                        user.getRole().name()
                )
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractUserId(Claims claims) {
        return UUID.fromString(
                claims.getSubject()
        );
    }

    public UUID extractTenantId(Claims claims) {
        return UUID.fromString(
                claims.get("tenantId", String.class)
        );
    }

    public boolean isTokenExpired(Claims claims) {
        return claims.getExpiration()
                .before(new Date());
    }

    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs;
    }
}