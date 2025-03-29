package org.yellowcat.backend.config.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

@JsonInclude(Include.NON_NULL)
public class ApiResponse<T> {
    private String status;
    private int statusCode;
    private String message;
    private T data;
    private Map<String, Object> metadata = new HashMap<>();

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp = LocalDateTime.now();

    private ApiResponse() {}

    public static <T> ApiResponse<T> of(HttpStatus status, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.status = status.name();
        response.statusCode = status.value();
        response.message = message;
        return response;
    }

    public static <T> ApiResponse<T> of(HttpStatus status, String message, T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.status = status.name();
        response.statusCode = status.value();
        response.message = message;
        response.data = data;
        return response;
    }

    public ApiResponse<T> addMetadata(String key, Object value) {
        this.metadata.put(key, value);
        return this;
    }

    // Getters and setters
    public String getStatus() {
        return status;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getMessage() {
        return message;
    }

    public T getData() {
        return data;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}