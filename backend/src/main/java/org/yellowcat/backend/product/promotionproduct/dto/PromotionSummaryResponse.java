package org.yellowcat.backend.product.promotionproduct.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PromotionSummaryResponse(
        Integer promotionProductId,
        String promotionCode,
        String promotionName,
        String description,
        String discountType,
        BigDecimal discountValue,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Boolean isActive
) {
} 