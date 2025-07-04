package org.yellowcat.backend.product.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductWithVariantsRequestDTO {
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
        private Integer colorId;
        private Integer sizeId;
        private BigDecimal price;
        private BigDecimal salePrice;
        private Integer stockLevel;
        private Integer stockLevelOnline;
        private Integer sold;
        private Integer soldOnline;
        private String imageUrl;
        private Double weight;
    }
}

