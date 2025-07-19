package org.yellowcat.backend.online_selling.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ProductVariantGemini {
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
