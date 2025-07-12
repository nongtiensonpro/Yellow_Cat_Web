package org.yellowcat.backend.online_selling.card_online.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Builder
@Data
public class ItemResponseDTO {
    private Integer cartItemId;
    private Integer variantId;
    private String productName;
    private int quantity;
    private BigDecimal price;
    private String colorName;
    private String sizeName;
    private String imageUrl;
    private String sku;
    private int stockLevel;
}
