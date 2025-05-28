package org.yellowcat.backend.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantDTO {
    private Integer variantId;
    private String sku;
    private String color;
    private String size;
    private BigDecimal price;
    private Integer stockLevel;
    private String imageUrl;
    private Double weight;
}