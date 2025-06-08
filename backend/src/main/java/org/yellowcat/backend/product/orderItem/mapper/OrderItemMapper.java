package org.yellowcat.backend.product.orderItem.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.orderItem.dto.OrderItemCreatedRequest;
import org.yellowcat.backend.product.orderItem.dto.OrderItemResponse;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "variant", ignore = true)
    @Mapping(target = "priceAtPurchase", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    OrderItem toOrderItem(OrderItemCreatedRequest request);

    @Mapping(target = "orderItemId", source = "orderItemId")
    @Mapping(source = "order.orderId", target = "orderId")
    @Mapping(source = "variant.variantId", target = "productVariantId")
    OrderItemResponse toOrderItemResponse(OrderItem orderItem);
}
