package org.yellowcat.backend.online_selling.cardItem_online.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CartItemDTO {
    private Integer variantId;
    private String productName;
    private int quantity;
    private BigDecimal price;
}
