package org.yellowcat.backend.product.productvariant.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductVariantFilterDTO {
    Integer productId;
    String productName;
    String description;
    String category;
    String brand;
    String material;
    String targetAudience;
    String color;
    String size;
    BigDecimal price;
    BigDecimal salePrice;
    Integer quantityInStock;
    Integer sold;
    String imageUrl;
    Double weight;
}
