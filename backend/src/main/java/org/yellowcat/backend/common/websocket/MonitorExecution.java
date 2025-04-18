package org.yellowcat.backend.common.websocket;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation để đánh dấu các phương thức cần được theo dõi thời gian thực thi
 * và các thông số khác.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface MonitorExecution {
    /**
     * Mô tả của phương thức (tùy chọn)
     */
    String description() default "";

    /**
     * Ngưỡng cảnh báo cho thời gian thực thi (ms)
     */
    long warningThreshold() default 1000;
}