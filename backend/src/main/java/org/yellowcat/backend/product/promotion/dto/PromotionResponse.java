package org.yellowcat.backend.product.promotion.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PromotionResponse {
    Integer id;
    String promoCode;
    String name;
    String description;
    String discountType;
    Double discountValue;
    LocalDateTime startDate;
    LocalDateTime endDate;
    Double minimumOrderValue;
    Integer usageLimitPerUser;
    Integer usageLimitTotal;
    Boolean isActive;
    String applicableTo;
}
