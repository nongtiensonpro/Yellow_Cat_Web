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
    PaymentRepository paymentRepository;

    @Transactional
    public Order createOrderFromOnlineRequest(OrderOnlineRequestDTO request) {
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subTotal = BigDecimal.ZERO;

        for (ProductOnlineDTO p : request.getProducts()) {

            ProductVariant variant = productVariantRepository.findById(p.getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + p.getId()));

            // Không cần trừ kho ở đây nữa
            // (Kho đã trừ ở bước xác nhận cart)

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

        AppUser user = null;
        if (request.getAppUser() != null && request.getAppUser().getKeycloakId() != null) {
            user = appUserRepository.findByKeycloakId(request.getAppUser().getKeycloakId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với keycloakId"));
        }

        Addresses shippingAddress = request.getShippingAddress();
        if (shippingAddress.getAddressId() == null) {
            shippingAddress.setAppUser(user);
            shippingAddress = addressRepository.save(shippingAddress);
        } else {
            shippingAddress = addressRepository.findById(shippingAddress.getAddressId())
                    .orElseThrow(() -> new RuntimeException("Địa chỉ không tồn tại"));
        }

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
                .orderStatus("Pending")
                .isSyncedToGhtk(false)
                .build();

        orderItems.forEach(i -> i.setOrder(order));

        Order savedOrder = orderRepository.save(order);

        //  Xóa các sản phẩm trong giỏ hàng của user
        if (user != null) {
            Cart cart = cartRepository.findByAppUser(user)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng"));

            List<CartItem> itemsToRemove = cart.getCartItems().stream()
                    .filter(cartItem -> request.getProducts().stream()
                            .anyMatch(p -> p.getId().equals(cartItem.getVariant().getVariantId())))
                    .toList();

            cartItemRepository.deleteAll(itemsToRemove);

            cart.getCartItems().removeAll(itemsToRemove);
            cartRepository.save(cart);

        }
        return savedOrder;
    }



    String generateOrderCode() {
        Random random = new Random();
        int randomNum = 10000 + random.nextInt(90000); // Sinh số ngẫu nhiên 5 chữ số
        return String.format("HD%d", randomNum);
    }

    @Transactional
    public Order cancelOrder(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (!order.getOrderStatus().equals("Pending")) {
            throw new RuntimeException("Chỉ được huỷ đơn hàng ở trạng thái 'Pending'");
        }

        // Cộng lại tồn kho
        for (OrderItem item : order.getOrderItems()) {
            ProductVariant variant = item.getVariant();
            variant.setQuantityInStock(variant.getQuantityInStock() + item.getQuantity());
            productVariantRepository.save(variant);
        }

        // Cập nhật trạng thái đơn hàng
        order.setOrderStatus("Cancelled");
        return orderRepository.save(order);
    }

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

    // Các trạng thái không thể chuyển tiếp nữa
    private boolean isTerminalStatus(String status) {
        return List.of("Cancelled", "Completed", "Refunded", "ReturnedToSeller").contains(status);
    }

    // Định nghĩa trạng thái chuyển tiếp hợp lệ
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
