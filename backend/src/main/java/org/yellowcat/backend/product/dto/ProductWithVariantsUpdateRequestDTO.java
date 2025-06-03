package org.yellowcat.backend.product.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductWithVariantsUpdateRequestDTO {
    private Integer productId;
    private String productName;
    private String description;
    private Integer brandId;
    private Integer categoryId;
    private Integer materialId;
    private Integer targetAudienceId;
    private String thumbnail;
    private List<ProductVariantDTO> variants;

    @Data
    public static class ProductVariantDTO {
        private Integer variantId;
        private String sku;
        private Integer colorId;
        private Integer sizeId;
        private BigDecimal price;
        private Integer stockLevel;
        private String imageUrl;
        private Double weight;
    }
}

