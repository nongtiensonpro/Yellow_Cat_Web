package org.yellowcat.backend.product.orderItem;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.order.OrderRepository;
import org.yellowcat.backend.product.orderItem.dto.OrderItemCreatedRequest;
import org.yellowcat.backend.product.orderItem.dto.OrderItemResponse;
import org.yellowcat.backend.product.orderItem.dto.UpdateOrderItemQuantityRequest;
import org.yellowcat.backend.product.orderItem.mapper.OrderItemMapper;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.product.ProductService;
import org.yellowcat.backend.product.promotionapplied.AppliedPromotion;
import org.yellowcat.backend.product.promotionapplied.AppliedPromotionRepository;
import org.yellowcat.backend.product.dto.VariantPromosDTO;
import org.yellowcat.backend.product.dto.VariantPromoItemDTO;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderItemService {
    OrderItemRepository orderItemRepository;
    OrderRepository orderRepository;
    ProductVariantRepository productVariantRepository;
    OrderItemMapper orderItemMapper;
    ProductService productService;
    AppliedPromotionRepository appliedPromotionRepository;

    public Page<OrderItemResponse> getOrderItemsByOrderId(Integer orderId, int page, int size) {
        Sort sort = Sort.by("priceAtPurchase").descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<OrderItem> orderItems = orderItemRepository.findByOrder_OrderId(orderId, pageable);

        return orderItems.map(orderItemMapper::toOrderItemResponse);
    }

    public OrderItemResponse createOrderItem(OrderItemCreatedRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + request.getOrderId()));
        List<OrderItem> orderItems = orderItemRepository.findByOrder_OrderId(request.getOrderId());

        ProductVariant productVariant = productVariantRepository.findById(request.getProductVariantId())
                .orElseThrow(() -> new IllegalArgumentException("Product variant not found with id: " + request.getProductVariantId()));

        // Tìm xem đã có OrderItem chưa
        OrderItem existingOrderItem = orderItems.stream()
                .filter(item -> item.getVariant().getVariantId().equals(request.getProductVariantId()))
                .findFirst()
                .orElse(null);

        if (existingOrderItem != null) {
            // Tăng số lượng (nếu thêm tiếp)
            int newQuantity = existingOrderItem.getQuantity() + request.getQuantity();
            int delta = request.getQuantity();

            // Kiểm tra tồn kho
            if (productVariant.getQuantityInStock() < delta)
                throw new IllegalArgumentException("Not enough stock for variant: " + productVariant.getSku());

            // Trừ kho
            productVariant.setQuantityInStock(productVariant.getQuantityInStock() - delta);

            // LƯU PRODUCT VARIANT TRƯỚC khi cập nhật order_item để tránh ghi đè trường sold
            productVariantRepository.save(productVariant);

            // Cập nhật order item
            existingOrderItem.setQuantity(newQuantity);
            // Sử dụng giá sau giảm (salePrice nếu có) để tính tổng tiền
            BigDecimal unitPrice = getEffectivePrice(productVariant);
            existingOrderItem.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(newQuantity)));
            orderItemRepository.save(existingOrderItem);
        } else {
            // Thêm mới order item
            if (productVariant.getQuantityInStock() < request.getQuantity())
                throw new IllegalArgumentException("Not enough stock for variant: " + productVariant.getSku());

            // Trừ kho
            productVariant.setQuantityInStock(productVariant.getQuantityInStock() - request.getQuantity());

            // LƯU PRODUCT VARIANT TRƯỚC khi tạo order_item để tránh ghi đè trường sold
            productVariantRepository.save(productVariant);

            OrderItem orderItem = orderItemMapper.toOrderItem(request);
            orderItem.setOrder(order);
            orderItem.setVariant(productVariant);
            orderItem.setQuantity(request.getQuantity());
            // Giá tại thời điểm mua = giá sau giảm (salePrice nếu có)
            BigDecimal unitPrice = getEffectivePrice(productVariant);
            orderItem.setPriceAtPurchase(unitPrice);
            orderItem.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(request.getQuantity())));

            // Snapshot promotion nếu có
            VariantPromosDTO promosDTO = productService.getVariantPromotions(productVariant.getVariantId());
            if (promosDTO != null && promosDTO.getBestPromo() != null) {
                VariantPromoItemDTO best = promosDTO.getBestPromo();
                AppliedPromotion ap = AppliedPromotion.builder()
                        .orderItem(orderItem)
                        .promoType("PRODUCT")
                        .promotionCode(best.getPromotionCode())
                        .promotionName(best.getPromotionName())
                        .discountType(best.getDiscountType())
                        .discountValue(best.getDiscountValue())
                        .discountAmount(best.getDiscountAmount())
                        .build();
                if (orderItem.getAppliedPromotions() == null) {
                    orderItem.setAppliedPromotions(new java.util.ArrayList<>());
                }
                orderItem.getAppliedPromotions().add(ap);
            }

            orderItemRepository.save(orderItem);
        }

        // ĐÃ lưu productVariant ở trên, tránh lưu lại sau khi trigger đã cập nhật trường sold
        updateOrderAmount(order);

        // Trả về order item vừa update/thêm
        OrderItem updatedOrderItem = orderItemRepository.findByOrder_OrderId(request.getOrderId()).stream()
                .filter(item -> item.getVariant().getVariantId().equals(request.getProductVariantId()))
                .findFirst().orElse(null);

        return orderItemMapper.toOrderItemResponse(updatedOrderItem);
    }

    public OrderItemResponse updateOrderItemQuantity(UpdateOrderItemQuantityRequest request) {
        OrderItem orderItem = orderItemRepository.findByIdWithOrder(request.getOrderItemId());

        ProductVariant variant = getProductVariant(request, orderItem);

        orderItem.setQuantity(request.getNewQuantity());
        // Cập nhật totalPrice dựa trên giá sau giảm (salePrice nếu có)
        BigDecimal unitPrice = getEffectivePrice(variant);
        orderItem.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(request.getNewQuantity())));

        productVariantRepository.save(variant);
        orderItemRepository.save(orderItem);
        updateOrderAmount(orderItem.getOrder());

        return orderItemMapper.toOrderItemResponse(orderItem);
    }

    private static ProductVariant getProductVariant(UpdateOrderItemQuantityRequest request, OrderItem orderItem) {
        ProductVariant variant = orderItem.getVariant();
        int oldQuantity = orderItem.getQuantity();
        int delta = request.getNewQuantity() - oldQuantity;

        // Xử lý tồn kho
        if (delta > 0) {
            // Tăng số lượng: kiểm tra đủ kho rồi trừ
            if (variant.getQuantityInStock() < delta)
                throw new IllegalArgumentException("Not enough stock for variant: " + variant.getSku());
            variant.setQuantityInStock(variant.getQuantityInStock() - delta);
        } else if (delta < 0) {
            // Giảm số lượng: trả lại kho
            variant.setQuantityInStock(variant.getQuantityInStock() - delta); // -delta là số dương
        }
        return variant;
    }

    public void deleteOrderItem(Integer orderItemId) {
        // Lấy luôn OrderItem có fetch order để tránh lazy
        OrderItem orderItem = orderItemRepository.findByIdWithOrder(orderItemId);
        ProductVariant variant = orderItem.getVariant();

        // Trả lại kho
        variant.setQuantityInStock(variant.getQuantityInStock() + orderItem.getQuantity());
        productVariantRepository.save(variant);

        Order order = orderItem.getOrder();
        orderItemRepository.delete(orderItem);

        // Lấy lại order đã fetch đầy đủ (tránh lazy)
        Order fetchedOrder = orderRepository.findByIdFetchAll(order.getOrderId());
        updateOrderAmount(fetchedOrder);
    }

    void updateOrderAmount(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrder_OrderId(order.getOrderId());
        BigDecimal subTotal = items.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal finalAmount = subTotal.add(shippingFee).subtract(discount);

        order.setSubTotalAmount(subTotal);
        order.setFinalAmount(finalAmount);
        orderRepository.save(order);
    }

    /**
     * Trả về giá hiệu lực của variant: ưu tiên salePrice nếu có, ngược lại dùng price gốc.
     */
    private BigDecimal getEffectivePrice(ProductVariant variant) {
        return variant.getSalePrice() != null ? variant.getSalePrice() : variant.getPrice();
    }
}
