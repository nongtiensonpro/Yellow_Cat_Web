package org.yellowcat.backend.product.promotion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PromotionRequest {
    @NotNull
    String promotionName;

    String description;

    @NotNull
    String discountType;

    @NotNull
    BigDecimal discountValue;

    LocalDateTime startDate;

    LocalDateTime endDate;

    Boolean isActive;
}