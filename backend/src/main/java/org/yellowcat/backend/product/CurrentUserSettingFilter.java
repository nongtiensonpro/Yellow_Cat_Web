package org.yellowcat.backend.product;

import java.io.IOException;
import java.sql.PreparedStatement;
import java.util.UUID;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.yellowcat.backend.user.AppUserRepository;

@Component
@Order(200)
@Slf4j
public class CurrentUserSettingFilter extends OncePerRequestFilter {
    private final JdbcTemplate jdbc;
    private final AppUserRepository appUserRepository;

    public CurrentUserSettingFilter(JdbcTemplate jdbc, AppUserRepository appUserRepository) {
        this.jdbc = jdbc;
        this.appUserRepository = appUserRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return "POST".equalsIgnoreCase(request.getMethod())
                && path.equals("/api/users/me");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            log.info("JWT claims: {}", jwt.getClaims());

            String keycloakUserId = jwt.getClaim("sub");

            appUserRepository.findByKeycloakId(UUID.fromString(keycloakUserId))
                    .ifPresentOrElse(appUser -> {
                        String username = appUser.getUsername();
                        jdbc.execute((ConnectionCallback<Void>) con -> {
                            try (PreparedStatement ps = con.prepareStatement("SELECT set_config('app.current_user', ?, false)")) {
                                ps.setString(1, username);
                                ps.execute();
                            }
                            return null;
                        });
                    }, () -> {
                        throw new IllegalArgumentException("User not found with Keycloak ID: " + keycloakUserId);
                    });

        } else {
            log.warn("Principal is not Jwt or Authentication is null: {}", auth != null ? auth.getPrincipal() : "null");
        }

        try {
            chain.doFilter(req, res);
        } finally {
            jdbc.execute((ConnectionCallback<Void>) con -> {
                try (PreparedStatement ps = con.prepareStatement("SELECT set_config('app.current_user', '', false)")) {
                    ps.execute();
                }
                return null;
            });
        }
    }
}