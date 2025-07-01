package org.yellowcat.backend.statistics.promotionstatistics;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface PromotionDetailProjection {
    Integer getPromotionId();
    String getPromotionCode();
    String getPromotionName();
    String getDiscountType();
    BigDecimal getDiscountValue();
    LocalDateTime getStartDate();
    LocalDateTime getEndDate();
    Boolean getIsActive();
    String getStatus();
} 