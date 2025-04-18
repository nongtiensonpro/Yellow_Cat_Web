package org.yellowcat.backend.common.config_api.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ được ném ra khi một tài nguyên được yêu cầu không tồn tại.
 */
public class ResourceNotFoundException extends BaseException {
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s không tìm thấy với %s: '%s'", resourceName, fieldName, fieldValue),
                HttpStatus.NOT_FOUND);
    }
}