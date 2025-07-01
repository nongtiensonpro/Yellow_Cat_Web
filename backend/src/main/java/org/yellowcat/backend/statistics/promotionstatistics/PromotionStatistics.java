package org.yellowcat.backend.statistics.promotionstatistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromotionStatistics {
    // Thống kê đợt khuyến mãi (promotions table)
    private Long totalPromotions;
    private Long activePromotions;
    private Long expiredPromotions;
    private Long upcomingPromotions;
    private Long inactivePromotions;
    
    // Thống kê sản phẩm được khuyến mãi (promotion_products table)
    private Long totalPromotionProducts;
    private Long activePromotionProducts;
    private Long expiredPromotionProducts;
    private Long upcomingPromotionProducts;
    
    // Statistics by discount type (from promotions)
    private Long percentageDiscounts;
    private Long fixedAmountDiscounts;
    private Long freeShippingDiscounts;
    
    // Overall value statistics (meaningful comparisons only)
    private BigDecimal totalDiscountValue;
    private BigDecimal averageDiscountValue;
    private BigDecimal maxDiscountValue;
    private BigDecimal minDiscountValue;
    
    // Detailed statistics for percentage discounts (%)
    private BigDecimal maxPercentageDiscount;
    private BigDecimal minPercentageDiscount;
    private BigDecimal avgPercentageDiscount;
    
    // Detailed statistics for fixed amount discounts (VND)
    private BigDecimal maxFixedAmountDiscount;
    private BigDecimal minFixedAmountDiscount;
    private BigDecimal avgFixedAmountDiscount;
    private BigDecimal totalFixedAmountDiscount;
    
    // Additional insights
    private BigDecimal mostCommonDiscountValue;
    private String mostPopularDiscountType;
    
    // Helper methods for better readability
    public boolean hasPromotions() {
        return totalPromotions != null && totalPromotions > 0;
    }
    
    public boolean hasPromotionProducts() {
        return totalPromotionProducts != null && totalPromotionProducts > 0;
    }
    
    public boolean hasPercentageDiscounts() {
        return percentageDiscounts != null && percentageDiscounts > 0;
    }
    
    public boolean hasFixedAmountDiscounts() {
        return fixedAmountDiscounts != null && fixedAmountDiscounts > 0;
    }
    
    public boolean hasFreeShippingDiscounts() {
        return freeShippingDiscounts != null && freeShippingDiscounts > 0;
    }
    
    public boolean hasValidDiscountData() {
        return hasPercentageDiscounts() || hasFixedAmountDiscounts();
    }
    
    // Calculated metrics
    public Double getPromotionProductsRatio() {
        if (totalPromotions == null || totalPromotions == 0) return 0.0;
        return totalPromotionProducts != null ? (double) totalPromotionProducts / totalPromotions : 0.0;
    }
    
    public Double getActivePromotionRatio() {
        if (totalPromotions == null || totalPromotions == 0) return 0.0;
        return activePromotions != null ? (double) activePromotions / totalPromotions * 100 : 0.0;
    }
} 