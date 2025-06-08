package org.yellowcat.backend.product.orderItem.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemResponse {
    private Integer orderItemId;
    private Integer orderId;
    private Integer productVariantId;
    private Integer quantity;
    private BigDecimal priceAtPurchase;
    private BigDecimal totalPrice;
}
