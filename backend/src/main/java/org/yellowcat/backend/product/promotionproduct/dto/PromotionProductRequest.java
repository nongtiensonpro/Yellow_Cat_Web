package org.yellowcat.backend.product.promotionproduct.dto;

import lombok.Data;

@Data
public class PromotionProductRequest {
    private Integer promotionId;
    private Integer variantId;
}
