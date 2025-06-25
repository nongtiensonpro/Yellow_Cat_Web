package org.yellowcat.backend.product.cart.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ItemResponseDTO {
    private Integer cartItemId;
    private Integer variantId;
    private String productName;
    private int quantity;
    private BigDecimal price;
}
