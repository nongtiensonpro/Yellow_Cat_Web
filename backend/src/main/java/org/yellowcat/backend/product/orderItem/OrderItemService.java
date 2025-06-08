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

            // Cập nhật order item
            existingOrderItem.setQuantity(newQuantity);
            existingOrderItem.setTotalPrice(productVariant.getPrice().multiply(BigDecimal.valueOf(newQuantity)));
            orderItemRepository.save(existingOrderItem);
        } else {
            // Thêm mới order item
            if (productVariant.getQuantityInStock() < request.getQuantity())
                throw new IllegalArgumentException("Not enough stock for variant: " + productVariant.getSku());

            // Trừ kho
            productVariant.setQuantityInStock(productVariant.getQuantityInStock() - request.getQuantity());

            OrderItem orderItem = orderItemMapper.toOrderItem(request);
            orderItem.setOrder(order);
            orderItem.setVariant(productVariant);
            orderItem.setQuantity(request.getQuantity());
            orderItem.setPriceAtPurchase(productVariant.getPrice());
            orderItem.setTotalPrice(productVariant.getPrice().multiply(BigDecimal.valueOf(request.getQuantity())));
            orderItemRepository.save(orderItem);
        }

        productVariantRepository.save(productVariant);
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
        orderItem.setTotalPrice(variant.getPrice().multiply(BigDecimal.valueOf(request.getNewQuantity())));

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
}
