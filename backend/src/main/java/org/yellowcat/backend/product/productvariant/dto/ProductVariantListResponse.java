package org.yellowcat.backend.product.productvariant.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantListResponse {
    private String productName;
    private String sku;
    private String color;
    private String size;
    private BigDecimal price;
    private BigDecimal salePrice;
    private Integer quantityInStock;
    private Integer sold;
    private String imageUrl;
    private Double weight;
}
