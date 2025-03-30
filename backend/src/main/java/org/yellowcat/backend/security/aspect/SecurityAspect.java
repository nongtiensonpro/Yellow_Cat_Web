package org.yellowcat.backend.security.aspect;

import io.micrometer.core.instrument.MeterRegistry;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.yellowcat.backend.security.annotation.RequirePermission;
import org.yellowcat.backend.security.annotation.SecuredResource;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Aspect
@Component
public class SecurityAspect {

    private final Map<String, Map<String, AtomicInteger>> accessAttempts = new ConcurrentHashMap<>();
    private final Map<String, Long> lastResetTime = new ConcurrentHashMap<>();


    private final MeterRegistry meterRegistry;

    public SecurityAspect(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Around("@annotation(org.yellowcat.backend.security.annotation.SecuredResource) || " +
            "@annotation(org.yellowcat.backend.security.annotation.RequirePermission)")
    public Object enforceSecurityCheck(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        // Kiểm tra authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new SecurityException("Unauthorized access - Authentication required");
        }

        // Xử lý SecuredResource annotation
        SecuredResource securedResource = method.getAnnotation(SecuredResource.class);
        if (securedResource != null) {
            validateSecuredResource(securedResource, authentication);
        }

        // Xử lý RequirePermission annotation
        RequirePermission requirePermission = method.getAnnotation(RequirePermission.class);
        if (requirePermission != null) {
            validateRequirePermission(requirePermission, authentication, method);
        }

        // Ghi metrics
        String metricName = "security.access" +
                          ".method." + method.getName() +
                          ".user." + authentication.getName();
        meterRegistry.counter(metricName).increment();

        return joinPoint.proceed();
    }

    private void validateSecuredResource(SecuredResource annotation, Authentication authentication) {
        if (annotation.requireAuthentication() && !authentication.isAuthenticated()) {
            throw new SecurityException("Authentication required");
        }

        if (annotation.roles().length > 0) {
            boolean hasRole = Arrays.stream(annotation.roles())
                    .anyMatch(role -> authentication.getAuthorities().stream()
                            .anyMatch(auth -> auth.getAuthority().equals("ROLE_" + role)));
            if (!hasRole) {
                throw new SecurityException("Insufficient role permissions");
            }
        }

        if (annotation.permissions().length > 0) {
            boolean hasPermission = Arrays.stream(annotation.permissions())
                    .anyMatch(permission -> authentication.getAuthorities().stream()
                            .anyMatch(auth -> auth.getAuthority().equals(permission)));
            if (!hasPermission) {
                throw new SecurityException("Insufficient permissions");
            }
        }
    }

    private void validateRequirePermission(RequirePermission annotation, Authentication authentication, Method method) {
        String key = authentication.getName() + ":" + method.getName();

        // Rate limiting check
        Map<String, AtomicInteger> userAttempts = accessAttempts.computeIfAbsent(key, k -> new ConcurrentHashMap<>());
        Long lastReset = lastResetTime.computeIfAbsent(key, k -> System.currentTimeMillis());

        // Reset counter if time window has passed
        if (System.currentTimeMillis() - lastReset > annotation.timeWindowSeconds() * 1000) {
            userAttempts.clear();
            lastResetTime.put(key, System.currentTimeMillis());
        }

        AtomicInteger attempts = userAttempts.computeIfAbsent(annotation.permission(), k -> new AtomicInteger(0));
        if (attempts.incrementAndGet() > annotation.maxAttempts()) {
            meterRegistry.counter("security.access.blocked").increment();
            throw new SecurityException("Rate limit exceeded for this resource");
        }

        // Permission check
        if (!authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals(annotation.permission()))) {
            meterRegistry.counter("security.access.denied").increment();
            throw new SecurityException("Access denied - Required permission: " + annotation.permission());
        }
    }
}