package org.yellowcat.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ được ném ra khi yêu cầu từ client không hợp lệ.
 */
public class BadRequestException extends BaseException {
    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause, HttpStatus.BAD_REQUEST);
    }
}