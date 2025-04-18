package org.yellowcat.backend.common.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface SecuredResource {
    String resource();
    String description();
    String[] roles() default {};
    String[] permissions() default {};
    boolean requireAuthentication() default true;
}