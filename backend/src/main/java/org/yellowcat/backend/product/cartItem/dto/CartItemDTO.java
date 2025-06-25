package org.yellowcat.backend.product.cartItem.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CartItemDTO {
    private Integer variantId;
    private String productName;
    private int quantity;
    private BigDecimal price;
}
