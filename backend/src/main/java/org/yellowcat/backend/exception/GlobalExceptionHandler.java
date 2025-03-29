package org.yellowcat.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.yellowcat.backend.response.ApiResponse;

import java.util.HashMap;
import java.util.Map;

/**
 * Xử lý ngoại lệ toàn cục cho ứng dụng.
 * Bắt tất cả các ngoại lệ và chuyển đổi chúng thành ApiResponse với định dạng nhất quán.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Xử lý các ngoại lệ tùy chỉnh từ lớp BaseException
     */
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ApiResponse<Object>> handleBaseException(BaseException ex, HttpServletRequest request) {
        logger.error("BaseException: {}", ex.getMessage(), ex);
        ApiResponse<Object> response = new ApiResponse<>(
                ex.getStatus(),
                ex.getMessage(),
                ex.getClass().getSimpleName(),
                request.getRequestURI());
        return new ResponseEntity<>(response, ex.getStatus());
    }

    /**
     * Xử lý lỗi validation từ @Valid annotation
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        logger.error("Validation error: {}", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                HttpStatus.BAD_REQUEST,
                "Lỗi validation",
                errors);
        response.setPath(request.getRequestURI());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Xử lý lỗi ràng buộc (constraint violations)
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {
        logger.error("Constraint violation: {}", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(violation -> {
            String fieldName = violation.getPropertyPath().toString();
            String errorMessage = violation.getMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                HttpStatus.BAD_REQUEST,
                "Lỗi ràng buộc",
                errors);
        response.setPath(request.getRequestURI());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Xử lý lỗi bind exception
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleBindException(
            BindException ex, HttpServletRequest request) {
        logger.error("Bind exception: {}", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                HttpStatus.BAD_REQUEST,
                "Lỗi binding",
                errors);
        response.setPath(request.getRequestURI());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Xử lý lỗi kiểu dữ liệu không khớp
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        logger.error("Type mismatch: {}", ex.getMessage());
        String error = String.format(
                "Tham số '%s' có giá trị '%s' không thể chuyển đổi thành kiểu %s",
                ex.getName(), ex.getValue(), ex.getRequiredType().getSimpleName());

        ApiResponse<Object> response = new ApiResponse<>(
                HttpStatus.BAD_REQUEST,
                "Lỗi kiểu dữ liệu không khớp",
                error,
                request.getRequestURI());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Xử lý tất cả các ngoại lệ khác không được xử lý cụ thể
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleAllExceptions(
            Exception ex, HttpServletRequest request) {
        logger.error("Unexpected error: {}", ex.getMessage(), ex);
        ApiResponse<Object> response = new ApiResponse<>(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Đã xảy ra lỗi không mong muốn",
                ex.getMessage(),
                request.getRequestURI());
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}