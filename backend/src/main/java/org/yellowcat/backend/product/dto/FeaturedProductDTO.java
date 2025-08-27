package org.yellowcat.backend.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FeaturedProductDTO {
    private Integer productId;
    private String productName;
    private String description;
    private Integer purchases;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
    
    // Category info
    private Integer categoryId;
    private String categoryName;
    
    // Brand info
    private Integer brandId;
    private String brandName;
    private String brandInfo;
    private String logoPublicId;
    
    // Material info
    private Integer materialId;
    private String materialName;
    
    // Target audience info
    private Integer targetAudienceId;
    private String targetAudienceName;
    
    // Product images
    private String thumbnail;
    
    // Pricing info
    private BigDecimal minPrice;
    private BigDecimal minSalePrice;
    private Long totalStock;
    
    // Review info
    private Double averageRating;
    private Integer totalReviews;
    
    // Variants with images
    private List<ProductVariantImageDTO> variants;
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductVariantImageDTO {
        private Integer variantId;
        private String sku;
        private String colorName;
        private String sizeName;
        private BigDecimal price;
        private BigDecimal salePrice;
        private Integer quantityInStock;
        private Integer sold;
        private String imageUrl;
        private Double weight;
        private BigDecimal costPrice;
    }
}
