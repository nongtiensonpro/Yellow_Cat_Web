package org.yellowcat.backend.common.config_api.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ được ném ra khi người dùng không có quyền truy cập vào tài nguyên cụ thể.
 */
public class ForbiddenException extends BaseException {
    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(message, cause, HttpStatus.FORBIDDEN);
    }
}