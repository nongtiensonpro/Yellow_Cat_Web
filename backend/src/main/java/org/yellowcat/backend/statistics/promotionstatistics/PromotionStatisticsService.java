package org.yellowcat.backend.statistics.promotionstatistics;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PromotionStatisticsService {
    private final PromotionStatisticsRepository repository;

    public PromotionStatisticsService(PromotionStatisticsRepository repository) {
        this.repository = repository;
    }

    /**
     * Lấy thống kê tổng quan về promotions
     */
    public PromotionStatistics getPromotionStatistics() {
        PromotionStatisticsProjection projection = repository.getPromotionStatistics();
        
        if (projection == null) {
            // Return empty statistics if no data
            return new PromotionStatistics(
                0L, 0L, 0L, 0L, 0L, // promotions stats
                0L, 0L, 0L, 0L,     // promotion_products stats
                0L, 0L, 0L,         // discount types
                null, null, null, null, // overall stats
                null, null, null,   // percentage stats
                null, null, null, null, // fixed amount stats
                null, null          // insights
            );
        }
        
        return convertToPromotionStatistics(projection);
    }

    /**
     * Lấy tất cả promotions với trạng thái
     */
    public List<PromotionDetail> getAllPromotionsWithStatus() {
        List<PromotionDetailProjection> projections = repository.getAllPromotionsWithStatus();
        return projections.stream()
                .map(this::convertToPromotionDetail)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách promotions đang hoạt động
     */
    public List<PromotionDetail> getActivePromotions() {
        List<PromotionDetailProjection> projections = repository.getActivePromotions();
        return projections.stream()
                .map(this::convertToPromotionDetail)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách promotions đã hết hạn
     */
    public List<PromotionDetail> getExpiredPromotions() {
        List<PromotionDetailProjection> projections = repository.getExpiredPromotions();
        return projections.stream()
                .map(this::convertToPromotionDetail)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách promotions sắp diễn ra
     */
    public List<PromotionDetail> getUpcomingPromotions() {
        List<PromotionDetailProjection> projections = repository.getUpcomingPromotions();
        return projections.stream()
                .map(this::convertToPromotionDetail)
                .collect(Collectors.toList());
    }

    /**
     * Convert projection to PromotionStatistics object
     */
    private PromotionStatistics convertToPromotionStatistics(PromotionStatisticsProjection projection) {
        return new PromotionStatistics(
                // Promotions statistics
                projection.getTotalPromotions(),
                projection.getActivePromotions(),
                projection.getExpiredPromotions(),
                projection.getUpcomingPromotions(),
                projection.getInactivePromotions(),
                
                // Promotion products statistics  
                projection.getTotalPromotionProducts(),
                projection.getActivePromotionProducts(),
                projection.getExpiredPromotionProducts(),
                projection.getUpcomingPromotionProducts(),
                
                // Discount type statistics
                projection.getPercentageDiscounts(),
                projection.getFixedAmountDiscounts(),
                projection.getFreeShippingDiscounts(),
                
                // Overall statistics
                projection.getTotalDiscountValue(),
                projection.getAverageDiscountValue(),
                projection.getMaxDiscountValue(),
                projection.getMinDiscountValue(),
                
                // Percentage discount statistics
                projection.getMaxPercentageDiscount(),
                projection.getMinPercentageDiscount(),
                projection.getAvgPercentageDiscount(),
                
                // Fixed amount discount statistics
                projection.getMaxFixedAmountDiscount(),
                projection.getMinFixedAmountDiscount(),
                projection.getAvgFixedAmountDiscount(),
                projection.getTotalFixedAmountDiscount(),
                
                // Additional insights
                projection.getMostCommonDiscountValue(),
                projection.getMostPopularDiscountType()
        );
    }

    /**
     * Convert projection to PromotionDetail object
     */
    private PromotionDetail convertToPromotionDetail(PromotionDetailProjection projection) {
        return new PromotionDetail(
                projection.getPromotionId(),
                projection.getPromotionCode(),
                projection.getPromotionName(),
                projection.getDiscountType(),
                projection.getDiscountValue(),
                projection.getStartDate(),
                projection.getEndDate(),
                projection.getIsActive(),
                projection.getStatus()
        );
    }
} 