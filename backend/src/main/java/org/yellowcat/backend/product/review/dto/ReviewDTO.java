package org.yellowcat.backend.product.review.dto;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public interface ReviewDTO {
    Integer getRating();
    String getComment();
    LocalDateTime getCreatedAt();
    String getCustomerName();
    String getCustomerAvatar();
    String getProductVariation();

    default String getFormatCreatedAt() {
        if (getCreatedAt() == null) {
            return "";
        }
        return getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm"));
    }
}
