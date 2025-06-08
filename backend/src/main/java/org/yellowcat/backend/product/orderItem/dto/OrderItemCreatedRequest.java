package org.yellowcat.backend.product.orderItem.dto;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level= AccessLevel.PRIVATE)
public class OrderItemCreatedRequest {
    Integer orderId;
    Integer productVariantId;
    Integer quantity;
}
