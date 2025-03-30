package org.yellowcat.backend.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.yellowcat.backend.exception.BaseException;
import org.yellowcat.backend.response.ApiResponse;

@Aspect
@Component
@Order(1)
public class ExceptionHandlingAspect {
    private static final Logger logger = LoggerFactory.getLogger(ExceptionHandlingAspect.class);

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *) || " +
            "within(@org.springframework.stereotype.Controller *)")
    public void controllerPointcut() {}

    @Around("controllerPointcut()")
    public Object handleException(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        
        try {
            logger.debug("Executing {}.{}", className, methodName);
            Object result = joinPoint.proceed();
            logger.debug("{}.{} completed successfully", className, methodName);
            return result;
        } catch (BaseException ex) {
            logger.error("BaseException in {}.{}: {}", className, methodName, ex.getMessage(), ex);
            return new ApiResponse<>(
                ex.getStatus(),
                ex.getMessage(),
                ex.getClass().getSimpleName());
        } catch (Exception ex) {
            logger.error("Unexpected error in {}.{}: {}", className, methodName, ex.getMessage(), ex);
            return new ApiResponse<>(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Đã xảy ra lỗi không mong muốn",
                ex.getMessage());
        }
    }
}