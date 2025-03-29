package org.yellowcat.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Lớp ngoại lệ cơ sở cho tất cả các ngoại lệ tùy chỉnh trong ứng dụng.
 * Cung cấp thông tin về mã trạng thái HTTP và thông báo lỗi.
 */
public abstract class BaseException extends RuntimeException {
    private final HttpStatus status;

    public BaseException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public BaseException(String message, Throwable cause, HttpStatus status) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}