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
    private List<ProductAttributeDTO> productAttributes;
    private List<VariantDTO> variants;

    @Data
    public static class ProductAttributeDTO {
        private List<AttributeDTO> attributes;
    }

    @Data
    public static class VariantDTO {
        private String sku;
        private BigDecimal price;
        private Integer stockLevel;
        private String imageUrl;
        private List<AttributeDTO> attributes;
    }

    @Data
    public static class AttributeDTO {
        private Integer attributeId;
        private String value;
    }
}

