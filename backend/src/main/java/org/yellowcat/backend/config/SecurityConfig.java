package org.yellowcat.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configure(http))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(authorize -> authorize
                // Cho phép truy cập không cần xác thực cho các endpoint công khai
                .requestMatchers("/demo/all", "/api/public/**","/api/users/**").permitAll()
                // Phân quyền dựa trên authority (client role) thay vì role
                .requestMatchers("/api/admin/**").hasAnyAuthority("Admin_Web")
                .requestMatchers("/api/manager/**").hasAnyAuthority("Manager_Web")
                .requestMatchers("/api/user/**").hasAnyAuthority("Staff_Web")
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
                    clientRoles.forEach(role -> authorities.add(new SimpleGrantedAuthority(role)));
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