package org.yellowcat.backend.product.order;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.order.dto.OrderResponse;
import org.yellowcat.backend.product.order.dto.OrderUpdateRequest;
import org.yellowcat.backend.product.order.dto.OrderUpdateResponse;
import org.yellowcat.backend.product.order.mapper.OrderMapper;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.orderItem.OrderItemRepository;
import org.yellowcat.backend.product.payment.Payment;
import org.yellowcat.backend.product.payment.PaymentRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {
    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    PaymentRepository paymentRepository;
    OrderMapper orderMapper;

    public Page<OrderResponse> getOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        return orderRepository.findAllOrders(pageable);
    }

    public Page<OrderResponse> getOrderByStatus(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String orderStatus = "Pending";

        return orderRepository.findAllByOrderStatus(orderStatus, pageable);
    }

    public OrderUpdateResponse updateOrder(OrderUpdateRequest request) {
        // Lấy danh sách OrderItem theo orderId
        List<OrderItem> orderItems = orderItemRepository.findByOrder_OrderId(request.getOrderId());

        // Lấy order theo orderId
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + request.getOrderId()));

        // Tính toán subTotalAmount
        BigDecimal subTotalAmount = orderItems.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Shipping fee
        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        // Discount amount
        BigDecimal discountAmount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;

        // Tính lại finalAmount
        BigDecimal finalAmount = subTotalAmount.add(shippingFee).subtract(discountAmount);

        // Cập nhật các thông tin nếu khác null
        if (request.getPhoneNumber() != null) {
            order.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getCustomerName() != null) {
            order.setCustomerName(request.getCustomerName());
        }
        order.setSubTotalAmount(subTotalAmount);
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(finalAmount);

        // Cập nhật/thêm mới payments nếu có
        if (request.getPayments() != null && !request.getPayments().isEmpty()) {
            for (OrderUpdateRequest.PaymentUpdateRequest paymentReq : request.getPayments()) {
                if (paymentReq.getPaymentId() == null) {
                    // Payment mới
                    Payment payment = new Payment();
                    payment.setOrder(order);
                    payment.setAmount(paymentReq.getAmount());
                    payment.setPaymentMethod(paymentReq.getPaymentMethod());
                    payment.setTransactionId(paymentReq.getTransactionId());

                    // Tự động cập nhật status:
                    if ("CASH".equalsIgnoreCase(paymentReq.getPaymentMethod()) ||
                            ("BANK_TRANSFER".equalsIgnoreCase(paymentReq.getPaymentMethod()) && paymentReq.getTransactionId() != null)) {
                        payment.setPaymentStatus("COMPLETED");
                    } else if (paymentReq.getTransactionId() != null && !paymentReq.getTransactionId().isEmpty()) {
                        payment.setPaymentStatus("COMPLETED");
                    } else {
                        payment.setPaymentStatus("PENDING");
                    }
                    paymentRepository.save(payment);
                } else {
                    // Payment đã tồn tại, update (tùy logic, cũng nên tính toán lại status)
                    Payment existing = paymentRepository.findById(paymentReq.getPaymentId())
                            .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentReq.getPaymentId()));
                    existing.setAmount(paymentReq.getAmount());
                    existing.setPaymentMethod(paymentReq.getPaymentMethod());
                    existing.setTransactionId(paymentReq.getTransactionId());
                    // Update lại status nếu cần:
                    if ("CASH".equalsIgnoreCase(paymentReq.getPaymentMethod()) ||
                            ("BANK_TRANSFER".equalsIgnoreCase(paymentReq.getPaymentMethod()) && paymentReq.getTransactionId() != null)) {
                        existing.setPaymentStatus("COMPLETED");
                    } else if (paymentReq.getTransactionId() != null && !paymentReq.getTransactionId().isEmpty()) {
                        existing.setPaymentStatus("COMPLETED");
                    } else {
                        existing.setPaymentStatus("PENDING");
                    }
                    paymentRepository.save(existing);
                }
            }
            // Load lại danh sách payments của order sau khi thêm/sửa
            List<Payment> updatedPayments = paymentRepository.findByOrder_OrderId(order.getOrderId());
            order.setPayments(updatedPayments);
        }

        // Tính tổng số tiền đã thanh toán (COMPLETED)
        BigDecimal totalPaid = order.getPayments() == null ? BigDecimal.ZERO :
                order.getPayments().stream()
                        .filter(p -> "COMPLETED".equalsIgnoreCase(p.getPaymentStatus()))
                        .map(Payment::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tự động set orderStatus theo tổng đã thanh toán
        if (totalPaid.compareTo(finalAmount) >= 0) {
            order.setOrderStatus("Paid");
        } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            order.setOrderStatus("Partial"); // Đã thanh toán một phần
        } else {
            order.setOrderStatus("Pending"); // Chưa thanh toán gì
        }

        // Lưu lại order đã cập nhật
        orderRepository.save(order);

        // Sử dụng MapStruct để chuyển sang DTO trả về
        return orderMapper.toOrderUpdateResponse(order);
    }

    //Tạo order mới
    public Order createOrder() {
        // Logic to create a new order
        Order order = Order.builder()
                .orderCode(generateOrderCode())
                .subTotalAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .build();

        // Save the order to the repository
        orderRepository.save(order);

        return order;
    }

    String generateOrderCode() {
        Random random = new Random();
        int randomNum = 10000 + random.nextInt(90000); // Sinh số ngẫu nhiên 5 chữ số
        return String.format("HD%d", randomNum);
    }
}
