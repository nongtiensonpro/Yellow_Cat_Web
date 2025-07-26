package org.yellowcat.backend.product.orderItem.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.AfterMapping;
import org.mapstruct.MappingTarget;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.orderItem.dto.OrderItemCreatedRequest;
import org.yellowcat.backend.product.orderItem.dto.OrderItemResponse;
import org.yellowcat.backend.product.promotionapplied.AppliedPromotion;
import java.math.BigDecimal;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "variant", ignore = true)
    @Mapping(target = "priceAtPurchase", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "appliedPromotions", ignore = true)
    OrderItem toOrderItem(OrderItemCreatedRequest request);

    @Mapping(target = "orderItemId", source = "orderItemId")
    @Mapping(source = "order.orderId", target = "orderId")
    @Mapping(source = "variant.variantId", target = "productVariantId")
    OrderItemResponse toOrderItemResponse(OrderItem orderItem);

    @AfterMapping
    default void enrichPromotions(OrderItem entity, @MappingTarget OrderItemResponse dto) {
        if (entity.getAppliedPromotions() != null && !entity.getAppliedPromotions().isEmpty()) {
            AppliedPromotion ap = entity.getAppliedPromotions().get(0); // Hiện tại chỉ có 1 promo/ item
            OrderItemResponse.BestPromo bp = new OrderItemResponse.BestPromo();
            bp.setPromotionCode(ap.getPromotionCode());
            bp.setPromotionName(ap.getPromotionName());
            bp.setDiscountAmount(ap.getDiscountAmount());
            dto.setBestPromo(bp);
            if (dto.getPriceAtPurchase() != null && ap.getDiscountAmount() != null) {
                dto.setOriginalPrice(dto.getPriceAtPurchase().add(ap.getDiscountAmount()));
            }
        }
    }
}
