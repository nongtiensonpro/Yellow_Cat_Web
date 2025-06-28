package org.yellowcat.backend.shoppingOnline;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.address.AddressRepository;
import org.yellowcat.backend.address.Addresses;
import org.yellowcat.backend.product.cart.Cart;
import org.yellowcat.backend.product.cart.CartRepository;
import org.yellowcat.backend.product.cartItem.CartItem;
import org.yellowcat.backend.product.cartItem.CartItemRepository;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.order.OrderRepository;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.orderItem.OrderItemRepository;
import org.yellowcat.backend.product.payment.PaymentRepository;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.product.shipment.ShipmentRepository;
import org.yellowcat.backend.product.shippingMethod.ShippingMethod;
import org.yellowcat.backend.product.shippingMethod.ShippingMethodIdRepository;
import org.yellowcat.backend.shoppingOnline.dto.OrderOnlineRequestDTO;
import org.yellowcat.backend.shoppingOnline.dto.ProductOnlineDTO;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrderOnlineService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final AddressRepository addressRepository;
    private final AppUserRepository appUserRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ShippingMethodIdRepository shippingMethodIdRepository;
    private final PaymentRepository paymentRepository;

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

            // (Kho đã được trừ ở bước xác nhận giỏ hàng)

            OrderItem item = OrderItem.builder()
                    .variant(variant)
                    .quantity(p.getQuantity())
                    .priceAtPurchase(p.getUnitPrice())
                    .totalPrice(p.getTotalPrice())
                    .build();

            orderItems.add(item);
            subTotal = subTotal.add(p.getTotalPrice());
        }

        BigDecimal shippingFee = request.getShippingFee();
        BigDecimal finalAmount = subTotal.add(shippingFee);

        // Tìm  AppUser
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

//        // Phương thức giao hàng
//        ShippingMethod shippingMethod = shippingMethodIdRepository.findByShippingMethodId(request.getShippingMethodId());

        // Tạo đơn hàng
        Order order = Order.builder()
                .orderCode(generateOrderCode())
                .user(user)
                .codeOrderInGHK(request.getCodeOrderInGHK())
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
//                .shippingMethod(shippingMethod)
                .orderStatus("Pending")
                .isSyncedToGhtk(false)
                .build();

        orderItems.forEach(i -> i.setOrder(order));

        Order savedOrder = orderRepository.save(order);

        // Xóa sản phẩm khỏi giỏ nếu có (user đăng nhập)
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

    /**
     * Cập nhật trạng thái đơn hàng với kiểm soát chuyển trạng thái hợp lệ
     */
    @Transactional
    public String updateOrderStatus(Integer orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        String currentStatus = order.getOrderStatus();

        if (currentStatus.equalsIgnoreCase(newStatus)) {
            throw new RuntimeException("Đơn hàng đã ở trạng thái này rồi.");
        }

        if (isTerminalStatus(currentStatus)) {
            throw new RuntimeException("Không thể thay đổi trạng thái của đơn hàng đã ở trạng thái kết thúc.");
        }

        Map<String, Set<String>> allowedTransitions = getAllowedTransitions();
        Set<String> allowedNextStates = allowedTransitions.getOrDefault(currentStatus, Collections.emptySet());

        if (!allowedNextStates.contains(newStatus)) {
            throw new RuntimeException("Không thể chuyển từ '" + currentStatus + "' sang '" + newStatus + "'");
        }

        order.setOrderStatus(newStatus);
        orderRepository.save(order);

        return "Chuyển sang trạng thái '" + newStatus + "' thành công.";
    }

    private boolean isTerminalStatus(String status) {
        return List.of("Cancelled", "Completed", "Refunded", "ReturnedToSeller").contains(status);
    }

    private Map<String, Set<String>> getAllowedTransitions() {
        Map<String, Set<String>> transitions = new HashMap<>();
        transitions.put("Pending", Set.of("Confirmed", "Cancelled"));
        transitions.put("Confirmed", Set.of("Shipping", "Cancelled"));
        transitions.put("Shipping", Set.of("Delivered", "DeliveryFailed1"));
        transitions.put("DeliveryFailed1", Set.of("DeliveryFailed2"));
        transitions.put("DeliveryFailed2", Set.of("DeliveryFailed3"));
        transitions.put("DeliveryFailed3", Set.of("ReturnedToSeller"));
        transitions.put("Delivered", Set.of("Completed", "ReturnRequested"));
        transitions.put("ReturnRequested", Set.of("Returned"));
        transitions.put("Returned", Set.of("Refunded"));
        return transitions;
    }
}
