package org.yellowcat.backend.common.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf
                        // Dùng cookie để lưu CSRF-token (httpOnly=false để FE có thể đọc nếu cần)
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        // Bỏ qua kiểm tra CSRF cho toàn bộ REST API, WebSocket & swagger (stateless / sử dụng Bearer token)
                        .ignoringRequestMatchers(
                                "/api/**",
                                "/ws/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/api-docs/**",
                                "/v3/api-docs/**"
                        )
                )
                .cors(cors -> cors.configure(http))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(authorize -> authorize

                        // Thêm WebSocket endpoint
                        .requestMatchers("/ws/**") // Cho phép tất cả request tới /ws/**
                        .permitAll()


                        // Cho phép truy cập không cần xác thực cho các endpoint công khai
                        .requestMatchers(
                                "/demo/all",
                                "/api/public/**",
                                "/api/users/**",
                                "/api/addresses/**",
                                "/api/address/**",
                                "/api/users/**",
                                "/api/ghtk/**",
                                "/api/orders/**",
                                "/api/waitlist/**",
                                "/api/cart/**",
                                "/api/order-timelines/**",
                                "/api/shipping-methods/**",
                                "/api/payment/**",
                                "/api/cart-items/**",
                                "/api/vnpay/**",
                                "/api/ghn/**",
                                "/api/examples/**")
                        .permitAll()


                        // Thêm các đường dẫn Swagger UI và API docs
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/api-docs/**",
                                "/v3/api-docs/**")
                        .permitAll().

                        //Orders private API
                                requestMatchers(
                                "/api/orders/**",
                                "/api/order-items/**"
                        ).hasAnyAuthority("Admin_Web", "Staff_Web").

                        // Product public API
                                requestMatchers(HttpMethod.GET,
                                "/api/products",
                                "/api/products/{id}",
                                "/api/product-variants"
                        ).permitAll().
                        // Product private API
                                requestMatchers(
                                "/api/products/**",
                                "/api/product-variants/**")
                        .hasAnyAuthority("Admin_Web").

                        // Customers public API
                        // Attributes public API
                                requestMatchers(HttpMethod.GET,
                                "/api/attributes",
                                "/api/attributes/{id}"
                        ).permitAll().

                        // Attributes private API
                                requestMatchers(
                                "/api/attributes/**")
                        .hasAnyAuthority("Admin_Web").

                        // Categories public API
                                requestMatchers(HttpMethod.GET,
                                "/api/categories",
                                "/api/categories/{id}"
                        ).permitAll().

                        // Attribute public API
                                requestMatchers(HttpMethod.GET,
                                "/api/colors",
                                "/api/colors/{id}",
                                "/api/sizes",
                                "/api/sizes/{id}",
                                "/api/materials",
                                "/api/materials/{id}",
                                "/api/target-audiences",
                                "/api/target-audiences/{id}"
                        ).permitAll().

                        // Categories private API
                                requestMatchers(
                                "/api/categories/**")
                        .hasAnyAuthority("Admin_Web").

                        // Promotion public API
                                requestMatchers(HttpMethod.GET,
                                "/api/promotions/**",
                                "/api/promotions/{id}"
                        ).permitAll().

                        // Promotion private API
                                requestMatchers(
                                "/api/promotions/**")
                        .hasAnyAuthority("Admin_Web").

                        // Brands public API
                                requestMatchers(HttpMethod.GET,
                                "/api/brands",
                                "/api/brands/{id}"
                        ).permitAll().

                        // Brands private API
                                requestMatchers(
                                "/api/brands/**")
                        .hasAnyAuthority("Admin_Web").

                        // Phân quyền dựa trên authority (client role) thay vì role
                                requestMatchers(
                                "/api/user/**")

                        .hasAnyAuthority("Staff_Web", "Admin_Web")

                        .requestMatchers(

                                "/api/admin/**"

                        )
                        .hasAnyAuthority("Admin_Web")

                        // Yêu cầu xác thực cho tất cả các yêu cầu khác
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                );

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

        grantedAuthoritiesConverter.setAuthorityPrefix("");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwt -> {
            List<GrantedAuthority> authorities = new ArrayList<>();

            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null && resourceAccess.containsKey("YellowCatCompanyWeb")) {
                Map<String, Object> clientResource = (Map<String, Object>) resourceAccess.get("YellowCatCompanyWeb");
                if (clientResource != null && clientResource.containsKey("roles")) {
                    List<String> clientRoles = (List<String>) clientResource.get("roles");
                    for (String role : clientRoles) {
                        authorities.add(new SimpleGrantedAuthority(role));
                        // Add specific permissions based on roles
                        if (role.equals("Admin_Web")) {
                            authorities.add(new SimpleGrantedAuthority("user.view"));
                            authorities.add(new SimpleGrantedAuthority("user.assign_roles"));
                            authorities.add(new SimpleGrantedAuthority("user.remove_roles"));
                            authorities.add(new SimpleGrantedAuthority("user.enable"));
                            authorities.add(new SimpleGrantedAuthority("user.disable"));
                            authorities.add(new SimpleGrantedAuthority("user.manage_roles"));
                        }
                    }
                }
            }

            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                List<String> realmRoles = (List<String>) realmAccess.get("roles");
                realmRoles.forEach(role -> authorities.add(new SimpleGrantedAuthority("REALM_" + role)));
            }

            return authorities;
        });

        return jwtAuthenticationConverter;
    }
}

