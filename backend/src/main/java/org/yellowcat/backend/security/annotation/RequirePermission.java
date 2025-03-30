package org.yellowcat.backend.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String permission();
    String description();
    
    /**
     * Time window in seconds for rate limiting
     */
    long timeWindowSeconds() default 60;
    
    /**
     * Maximum number of attempts allowed within the time window
     */
    int maxAttempts() default 100;
}