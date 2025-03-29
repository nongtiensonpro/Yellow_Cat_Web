package org.yellowcat.backend.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

/**
 * Lớp ApiResponse cung cấp một cấu trúc phản hồi API nhất quán cho toàn bộ ứng dụng.
 * Lớp này được sử dụng để bao bọc tất cả các phản hồi API, bao gồm cả thành công và lỗi.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private LocalDateTime timestamp;
    private int status;
    private String message;
    private T data;
    private String error;
    private String path;

    // Constructor mặc định
    public ApiResponse() {
        this.timestamp = LocalDateTime.now();
    }

    // Constructor cho phản hồi thành công với dữ liệu
    public ApiResponse(HttpStatus status, String message, T data) {
        this();
        this.status = status.value();
        this.message = message;
        this.data = data;
    }

    // Constructor cho phản hồi lỗi
    public ApiResponse(HttpStatus status, String message, String error) {
        this();
        this.status = status.value();
        this.message = message;
        this.error = error;
    }

    // Constructor cho phản hồi lỗi với đường dẫn
    public ApiResponse(HttpStatus status, String message, String error, String path) {
        this(status, message, error);
        this.path = path;
    }

    // Factory methods để tạo các phản hồi thông dụng
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(HttpStatus.OK, "Success", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(HttpStatus.OK, message, data);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(HttpStatus.CREATED, "Created successfully", data);
    }

    public static <T> ApiResponse<T> error(HttpStatus status, String message, String error) {
        return new ApiResponse<>(status, message, error);
    }

    // Getters and Setters
    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}