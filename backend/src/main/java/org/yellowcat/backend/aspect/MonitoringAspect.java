package org.yellowcat.backend.aspect;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.yellowcat.backend.aspect.annotation.MonitorExecution;

import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

@Aspect
@Component
public class MonitoringAspect {
    private static final Logger logger = LoggerFactory.getLogger(MonitoringAspect.class);
    private final MeterRegistry meterRegistry;

    public MonitoringAspect(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Around("@annotation(monitorExecution)")
    public Object monitorMethodExecution(ProceedingJoinPoint joinPoint, MonitorExecution monitorExecution) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String methodName = method.getName();
        String className = method.getDeclaringClass().getSimpleName();
        String description = monitorExecution.description().isEmpty() ?
                String.format("%s.%s", className, methodName) : monitorExecution.description();

        Timer.Sample sample = Timer.start(meterRegistry);
        long startTime = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;

            if (executionTime > monitorExecution.warningThreshold()) {
                logger.warn("{} took {}ms to execute (exceeded warning threshold of {}ms)",
                        description, executionTime, monitorExecution.warningThreshold());
            } else {
                logger.debug("{} took {}ms to execute", description, executionTime);
            }

            sample.stop(Timer.builder("method.execution")
                    .tag("class", className)
                    .tag("method", methodName)
                    .tag("status", "success")
                    .description(description)
                    .register(meterRegistry));

            return result;
        } catch (Exception e) {
            sample.stop(Timer.builder("method.execution")
                    .tag("class", className)
                    .tag("method", methodName)
                    .tag("status", "error")
                    .description(description)
                    .register(meterRegistry));
            throw e;
        }
    }
}