package org.yellowcat.backend.statistics.promotionstatistics;

import java.math.BigDecimal;

/**
 * Projection interface for promotion statistics
 * Maps directly to SQL query results
 */
public interface PromotionStatisticsProjection {
    // Thống kê đợt khuyến mãi (promotions table)
    Long getTotalPromotions();
    Long getActivePromotions();
    Long getExpiredPromotions();
    Long getUpcomingPromotions();
    Long getInactivePromotions();
    
    // Thống kê sản phẩm được khuyến mãi (promotion_products table)
    Long getTotalPromotionProducts();
    Long getActivePromotionProducts();
    Long getExpiredPromotionProducts();
    Long getUpcomingPromotionProducts();
    
    // Count by discount type (from promotions)
    Long getPercentageDiscounts();
    Long getFixedAmountDiscounts();
    Long getFreeShippingDiscounts();
    
    // Overall statistics (excluding free_shipping to avoid 0 values)
    BigDecimal getTotalDiscountValue();
    BigDecimal getAverageDiscountValue();
    BigDecimal getMaxDiscountValue();
    BigDecimal getMinDiscountValue();
    
    // Percentage discount statistics (%)
    BigDecimal getMaxPercentageDiscount();
    BigDecimal getMinPercentageDiscount();
    BigDecimal getAvgPercentageDiscount();
    
    // Fixed amount discount statistics (VND)
    BigDecimal getMaxFixedAmountDiscount();
    BigDecimal getMinFixedAmountDiscount();
    BigDecimal getAvgFixedAmountDiscount();
    BigDecimal getTotalFixedAmountDiscount();
    
    // Additional insights
    BigDecimal getMostCommonDiscountValue();
    String getMostPopularDiscountType();
} 