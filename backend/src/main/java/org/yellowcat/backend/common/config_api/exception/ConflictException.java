package org.yellowcat.backend.common.config_api.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ được ném ra khi có xung đột dữ liệu.
 */
public class ConflictException extends BaseException {
    public ConflictException(String message) {
        super(message, HttpStatus.CONFLICT);
    }

    public ConflictException(String message, Throwable cause) {
        super(message, cause, HttpStatus.CONFLICT);
    }
}