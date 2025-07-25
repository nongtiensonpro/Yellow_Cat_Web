package org.yellowcat.backend.product.productvariant;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.promotion.Promotion;
import org.yellowcat.backend.product.promotionproduct.PromotionProduct;
import org.yellowcat.backend.product.promotionproduct.PromotionProductRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service để tự động áp dụng promotion vào ProductVariant
 * Được gọi khi tạo mới hoặc cập nhật ProductVariant
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductVariantAutoPromotionService {

    private final PromotionProductRepository promotionProductRepository;

    /**
     * Tự động tính toán và áp dụng promotion tốt nhất cho ProductVariant
     * 
     * @param variant ProductVariant cần áp dụng promotion
     * @return true nếu có promotion được áp dụng, false nếu không
     */
    public boolean autoApplyBestPromotion(ProductVariant variant) {
        try {
            // Tìm promotion đang active cho variant này
            Promotion bestPromotion = findBestActivePromotion(variant.getVariantId());
            
            if (bestPromotion == null) {
                // Không có promotion → reset salePrice về null
                if (variant.getSalePrice() != null && !variant.getSalePrice().equals(BigDecimal.ZERO)) {
                    log.debug("Reset salePrice cho variant {} - không có promotion active", variant.getSku());
                    variant.setSalePrice(null);
                    return true; // Có thay đổi
                }
                return false; // Không có thay đổi
            }

            // Áp dụng promotion
            BigDecimal newSalePrice = calculateDiscountedPrice(variant.getPrice(), bestPromotion);
            
            // Chỉ update nếu salePrice thay đổi
            if (!newSalePrice.equals(variant.getSalePrice())) {
                log.info("Auto-apply promotion '{}' cho variant {}: {} → {}", 
                        bestPromotion.getPromotionName(),
                        variant.getSku(),
                        variant.getPrice(),
                        newSalePrice);
                
                variant.setSalePrice(newSalePrice);
                return true; // Có thay đổi
            }
            
            return false; // Không có thay đổi
            
        } catch (Exception e) {
            log.error("Lỗi khi auto-apply promotion cho variant {}: {}", 
                    variant.getSku(), e.getMessage(), e);
            return false;
        }
    }

    /**
     * Tìm promotion tốt nhất (giảm giá nhiều nhất) đang active cho variant
     */
    private Promotion findBestActivePromotion(Integer variantId) {
        LocalDateTime now = LocalDateTime.now();
        
        // Query để tìm promotion active cho variant này
        List<PromotionProduct> activePromotions = promotionProductRepository
                .findActivePromotionsByVariantId(variantId, now);
        
        if (activePromotions.isEmpty()) {
            return null;
        }

        // Nếu có nhiều promotion, chọn cái giảm giá nhiều nhất
        // (logic này có thể customize theo business rules)
        return activePromotions.stream()
                .map(PromotionProduct::getPromotion)
                .max((p1, p2) -> {
                    // So sánh dựa trên loại giảm giá và giá trị
                    if ("percentage".equals(p1.getDiscountType()) && "percentage".equals(p2.getDiscountType())) {
                        return p1.getDiscountValue().compareTo(p2.getDiscountValue());
                    } else if ("fixed_amount".equals(p1.getDiscountType()) && "fixed_amount".equals(p2.getDiscountType())) {
                        return p1.getDiscountValue().compareTo(p2.getDiscountValue());
                    } else {
                        // Mixed types - ưu tiên percentage cao hơn
                        return "percentage".equals(p1.getDiscountType()) ? 1 : -1;
                    }
                })
                .orElse(null);
    }

    /**
     * Tính toán giá sau khi áp dụng promotion
     */
    private BigDecimal calculateDiscountedPrice(BigDecimal originalPrice, Promotion promotion) {
        if ("percentage".equalsIgnoreCase(promotion.getDiscountType())) {
            double discount = promotion.getDiscountValue().doubleValue() / 100.0;
            double newPrice = originalPrice.doubleValue() * (1.0 - discount);
            return BigDecimal.valueOf(newPrice);
            
        } else if ("fixed_amount".equalsIgnoreCase(promotion.getDiscountType())) {
            double newPrice = originalPrice.doubleValue() - promotion.getDiscountValue().doubleValue();
            return BigDecimal.valueOf(Math.max(newPrice, 0)); // Không âm
            
        } else {
            // Loại promotion khác (e.g., free_shipping) - không thay đổi giá
            return originalPrice;
        }
    }

    /**
     * Batch process để áp dụng promotion cho nhiều variants cùng lúc
     * Hữu ích khi cần sync lại toàn bộ hệ thống
     */
    public int batchApplyPromotions(List<ProductVariant> variants) {
        int updatedCount = 0;
        
        for (ProductVariant variant : variants) {
            if (autoApplyBestPromotion(variant)) {
                updatedCount++;
            }
        }
        
        log.info("Batch apply promotion: {}/{} variants được cập nhật", updatedCount, variants.size());
        return updatedCount;
    }
} 