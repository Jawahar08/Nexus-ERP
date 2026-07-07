package com.nexuserp.security;

import com.nexuserp.user.User;
import com.nexuserp.user.UserRepository;
import com.nexuserp.user.UserStatus;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader =
                request.getHeader("Authorization");

        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token = authorizationHeader.substring(7);

        try {
            Claims claims = jwtService.parseToken(token);

            if (jwtService.isTokenExpired(claims)) {
                filterChain.doFilter(request, response);
                return;
            }

            UUID userId = jwtService.extractUserId(claims);
            UUID tokenTenantId =
                    jwtService.extractTenantId(claims);

            User user = userRepository
                    .findByIdAndStatus(
                            userId,
                            UserStatus.ACTIVE
                    )
                    .orElse(null);

            if (user == null
                    || !user.getTenant()
                            .getId()
                            .equals(tokenTenantId)) {

                filterChain.doFilter(request, response);
                return;
            }

            AuthenticatedUser principal =
                    new AuthenticatedUser(
                            user.getId(),
                            user.getTenant().getId(),
                            user.getEmail(),
                            user.getRole()
                    );

            SimpleGrantedAuthority authority =
                    new SimpleGrantedAuthority(
                            "ROLE_" + user.getRole().name()
                    );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            List.of(authority)
                    );

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

        } catch (Exception ignored) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}