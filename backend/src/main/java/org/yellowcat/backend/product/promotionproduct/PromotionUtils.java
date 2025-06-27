package org.yellowcat.backend.product.promotionproduct;

import org.yellowcat.backend.product.promotion.Promotion;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class PromotionUtils {

    public static BigDecimal calculateDiscountedPrice(BigDecimal originalPrice, Promotion promotion) {
        if (originalPrice == null || promotion == null) return originalPrice;

        BigDecimal discountedPrice = originalPrice;

        // Áp dụng kiểu giảm giá
        switch (promotion.getDiscountType().toUpperCase()) {
            case "PERCENT" -> {
                BigDecimal percent = promotion.getDiscountValue()
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                discountedPrice = originalPrice.subtract(originalPrice.multiply(percent));
            }
            case "FIXED_AMOUNT" -> {
                discountedPrice = originalPrice.subtract(promotion.getDiscountValue());
            }
            default -> {
                return originalPrice; // Kiểu giảm không hợp lệ → giữ nguyên
            }
        }

        // Không cho giá trị âm
        if (discountedPrice.compareTo(BigDecimal.ZERO) < 0) {
            discountedPrice = BigDecimal.ZERO;
        }

//        // Giới hạn giảm tối đa nếu có
//        BigDecimal maxDiscount = promotion.getMaxDiscountAmount();
//        if (maxDiscount != null) {
//            BigDecimal actualDiscount = originalPrice.subtract(discountedPrice);
//            if (actualDiscount.compareTo(maxDiscount) > 0) {
//                discountedPrice = originalPrice.subtract(maxDiscount);
//            }
//        }

        return discountedPrice.setScale(2, RoundingMode.HALF_UP);
    }
}
