
// DTO: PromotionProductResponse.java
package org.yellowcat.backend.product.promotionproduct.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PromotionProductResponse {
    private Integer promotionProductId;
    private String promotionCode;
    private String promotionName;
    private String discountType;
    private BigDecimal discountValue;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer variantId;
    private String sku;
    private BigDecimal price;
    private BigDecimal salePrice;
    private String imageUrl;
    private String productName;
}

