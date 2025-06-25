package org.yellowcat.backend.shoppingOnline;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.address.AddressRepository;
import org.yellowcat.backend.address.Addresses;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OrderOnlineService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final AddressRepository addressRepository;
    private final AppUserRepository appUserRepository;
    PaymentRepository paymentRepository;


    public Order createOrderFromOnlineRequest(OrderOnlineRequestDTO request) {
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subTotal = BigDecimal.ZERO;

        for (ProductOnlineDTO p : request.getProducts()) {
            ProductVariant variant = productVariantRepository.findById(p.getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + p.getId()));

            if (variant.getQuantityInStock() < p.getQuantity()) {
                throw new RuntimeException("Sản phẩm với ID " + p.getId() + " không đủ hàng trong kho. Hiện còn: " + variant.getQuantityInStock());
            }

            // Trừ tồn kho
            variant.setQuantityInStock(variant.getQuantityInStock() - p.getQuantity());
            productVariantRepository.save(variant); // cập nhật lại kho

            BigDecimal price = variant.getPrice();
            BigDecimal totalPrice = price.multiply(BigDecimal.valueOf(p.getQuantity()));

            OrderItem item = OrderItem.builder()
                    .variant(variant)
                    .quantity(p.getQuantity())
                    .priceAtPurchase(price)
                    .totalPrice(totalPrice)
                    .build();

            orderItems.add(item);
            subTotal = subTotal.add(totalPrice);
        }

        BigDecimal shippingFee = request.getShippingFee();
        BigDecimal finalAmount = subTotal.add(shippingFee);

        // Xử lý user từ keycloakId (nếu có)
        AppUser user = null;
        if (request.getAppUser() != null && request.getAppUser().getKeycloakId() != null) {
            user = appUserRepository.findByKeycloakId(request.getAppUser().getKeycloakId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với keycloakId"));
        }

        // Xử lý địa chỉ nếu không có addressId thì tạo mới
        Addresses shippingAddress = request.getShippingAddress();
        if (shippingAddress.getAddressId() == null) {
            shippingAddress.setAppUser(user); // gán user cho địa chỉ mới
            shippingAddress = addressRepository.save(shippingAddress);
        } else {
            shippingAddress = addressRepository.findById(shippingAddress.getAddressId())
                    .orElseThrow(() -> new RuntimeException("Địa chỉ không tồn tại"));
        }

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
                .build();

        orderItems.forEach(i -> i.setOrder(order));

        return orderRepository.save(order);
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
    public Order updateOrderStatus(Integer orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        String currentStatus = order.getOrderStatus();

        if (currentStatus.equalsIgnoreCase(newStatus)) {
            throw new RuntimeException("Đơn hàng đã ở trạng thái này rồi.");
        }

        if (currentStatus.equalsIgnoreCase("Cancelled")) {
            throw new RuntimeException("Đơn hàng đã bị hủy, không thể thay đổi trạng thái.");
        }

        if (currentStatus.equalsIgnoreCase("Completed")) {
            throw new RuntimeException("Đơn hàng đã hoàn thành, không thể thay đổi trạng thái.");
        }

        // Logic chuyển trạng thái hợp lệ
        switch (currentStatus) {
            case "Pending":
                if (!newStatus.equalsIgnoreCase("Confirmed") && !newStatus.equalsIgnoreCase("Cancelled")) {
                    throw new RuntimeException("Không thể chuyển từ 'Pending' sang '" + newStatus + "'");
                }
                break;
            case "Confirmed":
                if (!newStatus.equalsIgnoreCase("Delivered") && !newStatus.equalsIgnoreCase("Cancelled")) {
                    throw new RuntimeException("Không thể chuyển từ 'Confirmed' sang '" + newStatus + "'");
                }
                break;
            case "Delivered":
                if (!newStatus.equalsIgnoreCase("Completed")) {
                    throw new RuntimeException("Không thể chuyển từ 'Delivered' sang '" + newStatus + "'");
                }
                break;
            default:
                throw new RuntimeException("Trạng thái hiện tại không hợp lệ: " + currentStatus);
        }

        order.setOrderStatus(newStatus);
        return orderRepository.save(order);
    }


}
