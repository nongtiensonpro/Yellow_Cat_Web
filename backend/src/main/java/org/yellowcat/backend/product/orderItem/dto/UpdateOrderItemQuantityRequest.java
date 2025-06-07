package org.yellowcat.backend.product.orderItem.dto;

import lombok.Data;

@Data
public class UpdateOrderItemQuantityRequest {
    private Integer orderItemId;
    private Integer newQuantity;
}
