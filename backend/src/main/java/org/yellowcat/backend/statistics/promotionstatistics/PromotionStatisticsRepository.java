package org.yellowcat.backend.statistics.promotionstatistics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.promotion.Promotion;

import java.util.List;

@Repository
public interface PromotionStatisticsRepository extends JpaRepository<Promotion, Integer> {

    @Query(value = """
        SELECT 
            -- Thống kê đợt khuyến mãi (promotions table)
            COUNT(DISTINCT p.promotion_id) as totalPromotions,
            SUM(CASE 
                WHEN p.start_date <= CURRENT_TIMESTAMP 
                AND p.end_date >= CURRENT_TIMESTAMP 
                AND p.is_active = true 
                THEN 1 ELSE 0 
            END) as activePromotions,
            SUM(CASE 
                WHEN p.end_date < CURRENT_TIMESTAMP 
                THEN 1 ELSE 0 
            END) as expiredPromotions,
            SUM(CASE 
                WHEN p.start_date > CURRENT_TIMESTAMP 
                AND p.is_active = true 
                THEN 1 ELSE 0 
            END) as upcomingPromotions,
            SUM(CASE 
                WHEN p.is_active = false 
                THEN 1 ELSE 0 
            END) as inactivePromotions,
            
            -- Thống kê sản phẩm được khuyến mãi (promotion_products table)
            COUNT(pp.promotion_product_id) as totalPromotionProducts,
            SUM(CASE 
                WHEN p.start_date <= CURRENT_TIMESTAMP 
                AND p.end_date >= CURRENT_TIMESTAMP 
                AND p.is_active = true 
                THEN 1 ELSE 0 
            END) as activePromotionProducts,
            SUM(CASE 
                WHEN p.end_date < CURRENT_TIMESTAMP 
                THEN 1 ELSE 0 
            END) as expiredPromotionProducts,
            SUM(CASE 
                WHEN p.start_date > CURRENT_TIMESTAMP 
                AND p.is_active = true 
                THEN 1 ELSE 0 
            END) as upcomingPromotionProducts,
            
            -- Statistics by discount type (from promotions)
            SUM(CASE 
                WHEN p.discount_type = 'percentage' 
                THEN 1 ELSE 0 
            END) as percentageDiscounts,
            SUM(CASE 
                WHEN p.discount_type = 'fixed_amount' 
                THEN 1 ELSE 0 
            END) as fixedAmountDiscounts,
            SUM(CASE 
                WHEN p.discount_type = 'free_shipping' 
                THEN 1 ELSE 0 
            END) as freeShippingDiscounts,
            
            -- Overall statistics (exclude free_shipping to avoid 0 values)
            SUM(CASE 
                WHEN p.discount_type != 'free_shipping' AND p.discount_value > 0 
                THEN p.discount_value ELSE 0 
            END) as totalDiscountValue,
            AVG(CASE 
                WHEN p.discount_type != 'free_shipping' AND p.discount_value > 0 
                THEN p.discount_value 
            END) as averageDiscountValue,
            MAX(CASE 
                WHEN p.discount_type != 'free_shipping' AND p.discount_value > 0 
                THEN p.discount_value 
            END) as maxDiscountValue,
            MIN(CASE 
                WHEN p.discount_type != 'free_shipping' AND p.discount_value > 0 
                THEN p.discount_value 
            END) as minDiscountValue,
            
            -- Percentage discount statistics (%)
            MAX(CASE 
                WHEN p.discount_type = 'percentage' AND p.discount_value > 0 
                THEN p.discount_value 
            END) as maxPercentageDiscount,
            MIN(CASE 
                WHEN p.discount_type = 'percentage' AND p.discount_value > 0 
                THEN p.discount_value 
            END) as minPercentageDiscount,
            AVG(CASE 
                WHEN p.discount_type = 'percentage' AND p.discount_value > 0 
                THEN p.discount_value 
            END) as avgPercentageDiscount,
            
            -- Fixed amount discount statistics (VND)
            MAX(CASE 
                WHEN p.discount_type = 'fixed_amount' AND p.discount_value > 0 
                THEN p.discount_value 
            END) as maxFixedAmountDiscount,
            MIN(CASE 
                WHEN p.discount_type = 'fixed_amount' AND p.discount_value > 0 
                THEN p.discount_value 
            END) as minFixedAmountDiscount,
            AVG(CASE 
                WHEN p.discount_type = 'fixed_amount' AND p.discount_value > 0 
                THEN p.discount_value 
            END) as avgFixedAmountDiscount,
            SUM(CASE 
                WHEN p.discount_type = 'fixed_amount' AND p.discount_value > 0 
                THEN p.discount_value ELSE 0 
            END) as totalFixedAmountDiscount,
            
            -- Additional insights
            (SELECT p2.discount_value 
             FROM promotions p2 
             WHERE p2.discount_type != 'free_shipping' AND p2.discount_value > 0
             GROUP BY p2.discount_value 
             ORDER BY COUNT(*) DESC 
             LIMIT 1) as mostCommonDiscountValue,
            (SELECT p3.discount_type 
             FROM promotions p3 
             GROUP BY p3.discount_type 
             ORDER BY COUNT(*) DESC 
             LIMIT 1) as mostPopularDiscountType
        FROM promotions p
        LEFT JOIN promotion_products pp ON p.promotion_id = pp.promotion_id
        """, nativeQuery = true)
    PromotionStatisticsProjection getPromotionStatistics();

    @Query(value = """
        SELECT 
            p.promotion_id as promotionId,
            p.promotion_code as promotionCode,
            p.promotion_name as promotionName,
            p.discount_type as discountType,
            p.discount_value as discountValue,
            p.start_date as startDate,
            p.end_date as endDate,
            p.is_active as isActive,
            CASE 
                WHEN p.start_date <= CURRENT_TIMESTAMP 
                AND p.end_date >= CURRENT_TIMESTAMP 
                AND p.is_active = true 
                THEN 'ACTIVE'
                WHEN p.end_date < CURRENT_TIMESTAMP 
                THEN 'EXPIRED'
                WHEN p.start_date > CURRENT_TIMESTAMP 
                AND p.is_active = true 
                THEN 'UPCOMING'
                WHEN p.is_active = false 
                THEN 'INACTIVE'
                ELSE 'UNKNOWN'
            END as status
        FROM promotions p
        ORDER BY p.created_at DESC
        """, nativeQuery = true)
    List<PromotionDetailProjection> getAllPromotionsWithStatus();

    @Query(value = """
        SELECT 
            p.promotion_id as promotionId,
            p.promotion_code as promotionCode,
            p.promotion_name as promotionName,
            p.discount_type as discountType,
            p.discount_value as discountValue,
            p.start_date as startDate,
            p.end_date as endDate,
            p.is_active as isActive,
            'ACTIVE' as status
        FROM promotions p
        WHERE p.start_date <= CURRENT_TIMESTAMP 
        AND p.end_date >= CURRENT_TIMESTAMP 
        AND p.is_active = true
        ORDER BY p.end_date ASC
        """, nativeQuery = true)
    List<PromotionDetailProjection> getActivePromotions();

    @Query(value = """
        SELECT 
            p.promotion_id as promotionId,
            p.promotion_code as promotionCode,
            p.promotion_name as promotionName,
            p.discount_type as discountType,
            p.discount_value as discountValue,
            p.start_date as startDate,
            p.end_date as endDate,
            p.is_active as isActive,
            'EXPIRED' as status
        FROM promotions p
        WHERE p.end_date < CURRENT_TIMESTAMP
        ORDER BY p.end_date DESC
        """, nativeQuery = true)
    List<PromotionDetailProjection> getExpiredPromotions();

    @Query(value = """
        SELECT 
            p.promotion_id as promotionId,
            p.promotion_code as promotionCode,
            p.promotion_name as promotionName,
            p.discount_type as discountType,
            p.discount_value as discountValue,
            p.start_date as startDate,
            p.end_date as endDate,
            p.is_active as isActive,
            'UPCOMING' as status
        FROM promotions p
        WHERE p.start_date > CURRENT_TIMESTAMP 
        AND p.is_active = true
        ORDER BY p.start_date ASC
        """, nativeQuery = true)
    List<PromotionDetailProjection> getUpcomingPromotions();
} 