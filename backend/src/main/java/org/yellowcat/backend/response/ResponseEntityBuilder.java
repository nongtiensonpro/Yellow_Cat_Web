package org.yellowcat.backend.response;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Lớp tiện ích để xây dựng các ResponseEntity với ApiResponse.
 * Giúp các controller dễ dàng tạo các phản hồi API với định dạng nhất quán.
 */
public class ResponseEntityBuilder {

    /**
     * Tạo ResponseEntity thành công với dữ liệu
     *
     * @param data Dữ liệu trả về
     * @param <T>  Kiểu dữ liệu
     * @return ResponseEntity với ApiResponse
     */
    public static <T> ResponseEntity<ApiResponse<T>> success(T data) {
        return new ResponseEntity<>(ApiResponse.success(data), HttpStatus.OK);
    }

    /**
     * Tạo ResponseEntity thành công với thông báo và dữ liệu
     *
     * @param message Thông báo
     * @param data    Dữ liệu trả về
     * @param <T>     Kiểu dữ liệu
     * @return ResponseEntity với ApiResponse
     */
    public static <T> ResponseEntity<ApiResponse<T>> success(String message, T data) {
        return new ResponseEntity<>(ApiResponse.success(message, data), HttpStatus.OK);
    }

    /**
     * Tạo ResponseEntity với trạng thái tạo thành công (201 Created)
     *
     * @param data Dữ liệu trả về
     * @param <T>  Kiểu dữ liệu
     * @return ResponseEntity với ApiResponse
     */
    public static <T> ResponseEntity<ApiResponse<T>> created(T data) {
        return new ResponseEntity<>(ApiResponse.created(data), HttpStatus.CREATED);
    }

    /**
     * Tạo ResponseEntity với trạng thái tùy chỉnh
     *
     * @param status  Mã trạng thái HTTP
     * @param message Thông báo
     * @param data    Dữ liệu trả về
     * @param <T>     Kiểu dữ liệu
     * @return ResponseEntity với ApiResponse
     */
    public static <T> ResponseEntity<ApiResponse<T>> status(HttpStatus status, String message, T data) {
        return new ResponseEntity<>(new ApiResponse<>(status, message, data), status);
    }

    /**
     * Tạo ResponseEntity lỗi
     *
     * @param status  Mã trạng thái HTTP
     * @param message Thông báo
     * @param error   Chi tiết lỗi
     * @return ResponseEntity với ApiResponse
     */
    public static ResponseEntity<ApiResponse<Object>> error(HttpStatus status, String message, String error) {
        return new ResponseEntity<>(ApiResponse.error(status, message, error), status);
    }

    /**
     * Tạo ResponseEntity lỗi Bad Request (400)
     *
     * @param message Thông báo
     * @param error   Chi tiết lỗi
     * @return ResponseEntity với ApiResponse
     */
    public static ResponseEntity<ApiResponse<Object>> badRequest(String message, String error) {
        return error(HttpStatus.BAD_REQUEST, message, error);
    }

    /**
     * Tạo ResponseEntity lỗi Not Found (404)
     *
     * @param message Thông báo
     * @param error   Chi tiết lỗi
     * @return ResponseEntity với ApiResponse
     */
    public static ResponseEntity<ApiResponse<Object>> notFound(String message, String error) {
        return error(HttpStatus.NOT_FOUND, message, error);
    }

    /**
     * Tạo ResponseEntity lỗi Unauthorized (401)
     *
     * @param message Thông báo
     * @param error   Chi tiết lỗi
     * @return ResponseEntity với ApiResponse
     */
    public static ResponseEntity<ApiResponse<Object>> unauthorized(String message, String error) {
        return error(HttpStatus.UNAUTHORIZED, message, error);
    }

    /**
     * Tạo ResponseEntity lỗi Forbidden (403)
     *
     * @param message Thông báo
     * @param error   Chi tiết lỗi
     * @return ResponseEntity với ApiResponse
     */
    public static ResponseEntity<ApiResponse<Object>> forbidden(String message, String error) {
        return error(HttpStatus.FORBIDDEN, message, error);
    }

    /**
     * Tạo ResponseEntity lỗi Internal Server Error (500)
     *
     * @param message Thông báo
     * @param error   Chi tiết lỗi
     * @return ResponseEntity với ApiResponse
     */
    public static ResponseEntity<ApiResponse<Object>> serverError(String message, String error) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, message, error);
    }
}