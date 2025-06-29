package org.yellowcat.backend.online_selling.oder_online;


import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.address.AddressRepository;
import org.yellowcat.backend.address.Addresses;
import org.yellowcat.backend.online_selling.PaymentStatus;
import org.yellowcat.backend.online_selling.cardItem_online.CartItemOnlineRepository;
import org.yellowcat.backend.online_selling.card_online.CartOnlineRepository;
import org.yellowcat.backend.online_selling.oder_online.dto.OrderOnlineRequestDTO;
import org.yellowcat.backend.online_selling.oder_online.dto.ProductOnlineDTO;
import org.yellowcat.backend.online_selling.orderTimeline.OrderTimeline;
import org.yellowcat.backend.online_selling.orderTimeline.OrderTimelineRepository;
import org.yellowcat.backend.online_selling.orderTimeline.OrderTimelineService;
import org.yellowcat.backend.product.cartItem.CartItem;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.orderItem.OrderItemRepository;
import org.yellowcat.backend.product.payment.PaymentRepository;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.product.shippingMethod.ShippingMethod;
import org.yellowcat.backend.product.shippingMethod.ShippingMethodRepository;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrderOnlineService {
    private final OderOnlineRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final AddressRepository addressRepository;
    private final AppUserRepository appUserRepository;
    private final CartOnlineRepository cartRepository;
    private final CartItemOnlineRepository cartItemRepository;
    private final ShippingMethodRepository shippingMethodIdRepository;
    private final PaymentRepository paymentRepository;
    private final OrderTimelineRepository orderTimelineRepository;

    @Autowired
    OrderTimelineService orderTimelineService;

    /**
     * Tạo đơn hàng từ yêu cầu đặt hàng
     */
    @Transactional
    public Order createOrderFromOnlineRequest(OrderOnlineRequestDTO request) {
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subTotal = BigDecimal.ZERO;

        // Xử lý sản phẩm
        for (ProductOnlineDTO p : request.getProducts()) {
            ProductVariant variant = productVariantRepository.findById(p.getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + p.getId()));

            BigDecimal unitPrice = variant.getSalePrice() != null ? variant.getSalePrice() : variant.getPrice();
            BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(p.getQuantity()));

            OrderItem item = OrderItem.builder()
                    .variant(variant)
                    .quantity(p.getQuantity())
                    .priceAtPurchase(unitPrice)
                    .totalPrice(totalPrice)
                    .build();

            orderItems.add(item);
            subTotal = subTotal.add(totalPrice);
        }

        BigDecimal shippingFee = request.getShippingFee() != null ? request.getShippingFee() : BigDecimal.ZERO;
        BigDecimal finalAmount = subTotal.add(shippingFee);

        // Tìm AppUser
        AppUser user = null;
        if (request.getAppUser() != null && request.getAppUser().getKeycloakId() != null) {
            user = appUserRepository.findByKeycloakId(request.getAppUser().getKeycloakId())
                    .orElse(null);
        }

        // Xử lý địa chỉ giao hàng
        Addresses shippingAddress = request.getShippingAddress();
        if (shippingAddress.getAddressId() == null) {
            shippingAddress.setAppUser(user);
            shippingAddress = addressRepository.save(shippingAddress);
        } else {
            shippingAddress = addressRepository.findById(shippingAddress.getAddressId())
                    .orElseThrow(() -> new RuntimeException("Địa chỉ không tồn tại"));
        }

        PaymentStatus paymentStatus = request.getPaymentStatus();
        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.UNPAID; // fallback nếu không truyền
        }

        System.out.println("shipping methot được chuyền vào: "+ request.getShippingMethodId());
        ShippingMethod shippingOption = shippingMethodIdRepository.findById(request.getShippingMethodId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phương thức giao hàng với ID: " + request.getShippingMethodId()));


        // Tạo đơn hàng
        Order order = Order.builder()
                .orderCode(generateOrderCode())
                .user(user)
                .shippingAddress(shippingAddress)
                .phoneNumber(request.getAppUser() != null ? request.getAppUser().getPhoneNumber() : null)
                .customerName(request.getAppUser() != null ? request.getAppUser().getUsername() : null)
                .subTotalAmount(subTotal)
                .shippingFee(shippingFee)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(finalAmount)
                .customerNotes(request.getNote())
                .orderItems(orderItems)
                .orderDate(LocalDateTime.now())
                .orderStatus("Pending")
                .isSyncedToGhtk(false)
                .paymentStatus(paymentStatus)
                .shippingMethod(shippingOption)
                .build();

        // Gán order vào từng orderItem trước khi lưu
        orderItems.forEach(i -> i.setOrder(order));

        // Lưu order
        Order savedOrder = orderRepository.save(order);

        // Tạo timeline
        OrderTimeline timeline = new OrderTimeline();
        timeline.setNote(request.getNote());
        timeline.setFromStatus("");
        timeline.setToStatus("Pending");
        timeline.setChangedAt(LocalDateTime.now());
        timeline.setOrderId(savedOrder.getOrderId()); // Dùng savedOrder mới có ID
        orderTimelineRepository.save(timeline);

        // Xóa sản phẩm khỏi giỏ hàng nếu user đăng nhập
        if (user != null) {
            cartRepository.findByAppUser(user).ifPresent(cart -> {
                List<CartItem> itemsToRemove = cart.getCartItems().stream()
                        .filter(cartItem -> request.getProducts().stream()
                                .anyMatch(p -> p.getId().equals(cartItem.getVariant().getVariantId())))
                        .toList();

                cartItemRepository.deleteAll(itemsToRemove);
                cart.getCartItems().removeAll(itemsToRemove);
                cartRepository.save(cart);
            });
        }

        return savedOrder;
    }


    /**
     * Sinh mã đơn hàng dạng HDxxxxx
     */
    private String generateOrderCode() {
        int randomNum = 10000 + new Random().nextInt(90000);
        return String.format("HD%d", randomNum);
    }

    /**
     * Hủy đơn hàng và hoàn kho nếu đang ở trạng thái 'Pending'
     */
    @Transactional
    public Order cancelOrder(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (!order.getOrderStatus().equals("Pending")) {
            throw new RuntimeException("Chỉ được huỷ đơn hàng ở trạng thái 'Pending'");
        }

        // Hoàn kho
        for (OrderItem item : order.getOrderItems()) {
            ProductVariant variant = item.getVariant();
            variant.setQuantityInStock(variant.getQuantityInStock() + item.getQuantity());
            productVariantRepository.save(variant);
        }

        order.setOrderStatus("Cancelled");
        return orderRepository.save(order);
    }

}
