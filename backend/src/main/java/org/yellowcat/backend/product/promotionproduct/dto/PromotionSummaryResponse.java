package org.yellowcat.backend.product.promotionproduct.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PromotionSummaryResponse(
        Integer promotionProductId,
        String promotionName,
        String discountType,
        BigDecimal discountValue,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Boolean isActive
) {
} 