package org.yellowcat.backend.product.dto;

/**
 * DTO cho dữ liệu tổng quan sản phẩm dành cho AI
 * Được tối ưu hóa để AI có thể đọc và tư vấn khách hàng hiệu quả
 */
public record ProductOverviewForAIDTO(
        // Thông tin cơ bản
        Integer productId,
        String productName,
        String description,  // Mô tả chi tiết sản phẩm - rất hữu ích cho AI
        String brandName,
        String categoryName,
        String targetAudience,
        String materialName,
        
        // Thông tin giá cả
        java.math.BigDecimal minPrice,
        java.math.BigDecimal maxPrice,
        java.math.BigDecimal minSalePrice,  // Giá khuyến mãi thấp nhất (nếu có)
        
        // Thông tin tồn kho và bán hàng
        Integer totalStock,
        Integer totalSold,
        Integer purchases,
        
        // Thông tin màu sắc và kích thước
        String availableColors,
        String availableSizes,
        
        // Thông tin đánh giá
        Double averageRating,
        Integer totalReviews,
        
        // Trạng thái
        Boolean isActive,
        Boolean isFeatured,
        Boolean hasPromotion
) {
    /**
     * Phương thức tiện ích để kiểm tra sản phẩm có đang sale không
     */
    public boolean isOnSale() {
        return minSalePrice != null && minSalePrice.compareTo(java.math.BigDecimal.ZERO) > 0;
    }
    
    /**
     * Lấy giá hiển thị (ưu tiên giá sale nếu có)
     */
    public java.math.BigDecimal getDisplayPrice() {
        return isOnSale() ? minSalePrice : minPrice;
    }
    
    /**
     * Tính phần trăm giảm giá (nếu có sale)
     */
    public Integer getDiscountPercentage() {
        if (!isOnSale()) return 0;
        
        java.math.BigDecimal discount = minPrice.subtract(minSalePrice);
        java.math.BigDecimal percentage = discount.divide(minPrice, 4, java.math.RoundingMode.HALF_UP)
                                                 .multiply(java.math.BigDecimal.valueOf(100));
        return percentage.intValue();
    }
}
