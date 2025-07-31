//package org.yellowcat.backend.common.config_api.response;
//
//import com.fasterxml.jackson.annotation.JsonInclude;
//import org.springframework.http.HttpStatus;
//
//import java.time.LocalDateTime;
//
///**
// * Lớp ApiResponse cung cấp một cấu trúc phản hồi API nhất quán cho toàn bộ ứng dụng.
// * Lớp này được sử dụng để bao bọc tất cả các phản hồi API, bao gồm cả thành công và lỗi.
// */
//@JsonInclude(JsonInclude.Include.NON_NULL)
//public class ApiResponse<T> {
//    private LocalDateTime timestamp;
//    private int status;
//    private String message;
//    private T data;
//    private String error;
//    private String path;
//
//    // Constructor mặc định
//    public ApiResponse() {
//        this.timestamp = LocalDateTime.now();
//    }
//
//    // Constructor cho phản hồi thành công với dữ liệu
//    public ApiResponse(HttpStatus status, String message, T data) {
//        this();
//        this.status = status.value();
//        this.message = message;
//        this.data = data;
//    }
//
//    // Constructor cho phản hồi lỗi
//    public ApiResponse(HttpStatus status, String message, String error) {
//        this();
//        this.status = status.value();
//        this.message = message;
//        this.error = error;
//    }
//
//    // Constructor cho phản hồi lỗi với đường dẫn
//    public ApiResponse(HttpStatus status, String message, String error, String path) {
//        this(status, message, error);
//        this.path = path;
//    }
//
//    // Factory methods để tạo các phản hồi thông dụng
//    public static <T> ApiResponse<T> success(T data) {
//        return new ApiResponse<>(HttpStatus.OK, "Success", data);
//    }
//
//    public static <T> ApiResponse<T> success(String message, T data) {
//        return new ApiResponse<>(HttpStatus.OK, message, data);
//    }
//
//    public static <T> ApiResponse<T> created(T data) {
//        return new ApiResponse<>(HttpStatus.CREATED, "Created successfully", data);
//    }
//
//    public static <T> ApiResponse<T> error(HttpStatus status, String message, String error) {
//        return new ApiResponse<>(status, message, error);
//    }
//
//    // Getters and Setters
//    public LocalDateTime getTimestamp() {
//        return timestamp;
//    }
//
//    public void setTimestamp(LocalDateTime timestamp) {
//        this.timestamp = timestamp;
//    }
//
//    public int getStatus() {
//        return status;
//    }
//
//    public void setStatus(int status) {
//        this.status = status;
//    }
//
//    public String getMessage() {
//        return message;
//    }
//
//    public void setMessage(String message) {
//        this.message = message;
//    }
//
//    public T getData() {
//        return data;
//    }
//
//    public void setData(T data) {
//        this.data = data;
//    }
//
//    public String getError() {
//        return error;
//    }
//
//    public void setError(String error) {
//        this.error = error;
//    }
//
//    public String getPath() {
//        return path;
//    }
//
//    public void setPath(String path) {
//        this.path = path;
//    }
//}


package org.yellowcat.backend.common.config_api.response;

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
    private boolean success; // <--- THÊM TRƯỜNG NÀY VÀO
    private String message;
    private T data;
    private String error; // Trường này có thể đổi tên thành 'details' cho rõ nghĩa hơn, nhưng giữ nguyên theo code cũ
    private String path;

    // Constructor mặc định
    public ApiResponse() {
        this.timestamp = LocalDateTime.now();
    }

    // Constructor cho phản hồi thành công với dữ liệu
    public ApiResponse(HttpStatus status, String message, T data) {
        this();
        this.status = status.value();
        this.success = true; // <--- Đặt là true cho phản hồi thành công
        this.message = message;
        this.data = data;
        this.error = null; // Đảm bảo trường error là null khi thành công
    }

    // Constructor cho phản hồi lỗi
    // Đã đổi tên tham số 'error' thành 'details' để khớp với cách sử dụng trước đó (ex.getMessage())
    public ApiResponse(HttpStatus status, String message, String details) {
        this();
        this.status = status.value();
        this.success = false; // <--- Đặt là false cho phản hồi lỗi
        this.message = message;
        this.error = details; // Gán chi tiết lỗi vào trường 'error'
        this.data = null; // Đảm bảo trường data là null khi có lỗi
    }

    // Constructor cho phản hồi lỗi với đường dẫn
    public ApiResponse(HttpStatus status, String message, String details, String path) {
        this(status, message, details); // Gọi constructor lỗi phía trên
        this.path = path;
    }

    // Factory methods để tạo các phản hồi thông dụng
    // Cần điều chỉnh để sử dụng constructor mới và đặt 'success'
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(HttpStatus.OK, "Success", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(HttpStatus.OK, message, data);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(HttpStatus.CREATED, "Created successfully", data);
    }

    // Phương thức error này đã đúng, nó gọi constructor lỗi
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

    // Thêm getter và setter cho trường 'success'
    public boolean isSuccess() { // Getter cho boolean thường là isFieldName()
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
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