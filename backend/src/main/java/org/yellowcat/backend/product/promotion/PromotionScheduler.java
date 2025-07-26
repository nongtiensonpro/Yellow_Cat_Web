package org.yellowcat.backend.product.promotion;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.yellowcat.backend.product.promotionproduct.PromotionProductRepository;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PromotionScheduler {

    private final PromotionRepository promotionRepository;
    private final PromotionProductRepository promotionProductRepository;
    private final ProductVariantRepository productVariantRepository;

    @Scheduled(cron = "0 0 0 * * *") // chạy mỗi ngày lúc 00:00
    @Transactional
    public void updateExpiredPromotions() {
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> expired = promotionRepository.findByEndDateBeforeAndIsActiveTrue(now);

        if (!expired.isEmpty()) {
            log.info("Tìm thấy {} promotion hết hạn cần xử lý", expired.size());
            
            // Set promotion thành inactive
            expired.forEach(p -> p.setIsActive(false));
            promotionRepository.saveAll(expired);
            
            // 🔥 BỔ SUNG: Reset salePrice về null cho tất cả variants thuộc promotion hết hạn
            int totalVariantsReset = 0;
            for (Promotion promotion : expired) {
                List<Integer> variantIds = promotionProductRepository.findVariantIdsByPromotionId(promotion.getId());
                if (!variantIds.isEmpty()) {
                    List<ProductVariant> variants = productVariantRepository.findAllById(variantIds);
                    
                    variants.forEach(variant -> {
                        log.debug("Reset salePrice cho variant ID: {} (SKU: {})", 
                                variant.getVariantId(), variant.getSku());
                        variant.setSalePrice(null);
                    });
                    
                    productVariantRepository.saveAll(variants);
                    totalVariantsReset += variants.size();
                    
                    log.info("Đã reset salePrice cho {} variants của promotion: {} (ID: {})", 
                            variants.size(), promotion.getPromotionName(), promotion.getId());
                }
            }
            
            log.info("✅ Hoàn thành: Đã cập nhật {} promotion hết hạn thành inactive và reset salePrice cho {} variants", 
                    expired.size(), totalVariantsReset);
        } else {
            log.debug("Không có promotion nào hết hạn cần xử lý");
        }
    }

    /**
     * Method test thủ công để admin có thể kiểm tra logic reset promotion hết hạn
     * Có thể được gọi thông qua API endpoint cho mục đích testing
     */
    @Transactional
    public String manualCheckExpiredPromotions() {
        log.info("🔧 MANUAL TEST: Bắt đầu kiểm tra promotion hết hạn...");
        
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> expired = promotionRepository.findByEndDateBeforeAndIsActiveTrue(now);
        
        if (expired.isEmpty()) {
            String message = "✅ Không có promotion nào hết hạn cần xử lý";
            log.info(message);
            return message;
        }
        
        StringBuilder result = new StringBuilder();
        result.append(String.format("📋 Tìm thấy %d promotion hết hạn:\n", expired.size()));
        
        int totalVariantsReset = 0;
        for (Promotion promotion : expired) {
            List<Integer> variantIds = promotionProductRepository.findVariantIdsByPromotionId(promotion.getId());
            result.append(String.format("- %s (ID: %d) - %d variants sẽ được reset\n", 
                    promotion.getPromotionName(), promotion.getId(), variantIds.size()));
            totalVariantsReset += variantIds.size();
        }
        
        result.append(String.format("\n📊 Tổng cộng: %d variants sẽ được reset salePrice", totalVariantsReset));
        result.append("\n⚠️  Để thực thi, hãy chạy updateExpiredPromotions()");
        
        String finalResult = result.toString();
        log.info("🔧 MANUAL TEST KẾT QUẢ:\n{}", finalResult);
        return finalResult;
    }
}