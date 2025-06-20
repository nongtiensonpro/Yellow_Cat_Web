
package org.yellowcat.backend.product.review.dto;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public interface ReviewDTO {
    Long getId();
    Integer getRating();
    String getComment();
    Instant getCreatedAt();
    String getCustomerName();
    String getCustomerAvatar();
    Boolean getIsPurchased();
    String getImageUrl();

    default String getFormatCreatedAt() {
        if (getCreatedAt() == null) return "";
        return DateTimeFormatter.ofPattern("dd MMMM yyyy, HH:mm")
                .withZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                .format(getCreatedAt());
    }
}

