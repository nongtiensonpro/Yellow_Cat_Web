package org.yellowcat.backend.product.order;

import jakarta.persistence.EntityNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yellowcat.backend.product.order.dto.OrderDetailProjection;
import org.yellowcat.backend.product.order.dto.OrderDetailResponse;
import org.yellowcat.backend.product.order.dto.OrderDetailWithItemsResponse;
import org.yellowcat.backend.product.order.dto.OrderResponse;
import org.yellowcat.backend.product.order.dto.OrderUpdateRequest;
import org.yellowcat.backend.product.order.dto.OrderUpdateResponse;
import org.yellowcat.backend.product.orderItem.dto.OrderItemDetailProjection;
import org.yellowcat.backend.product.orderItem.dto.OrderItemDetailResponse;
import org.yellowcat.backend.product.order.mapper.OrderMapper;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.orderItem.OrderItemRepository;
import org.yellowcat.backend.product.payment.Payment;
import org.yellowcat.backend.product.payment.PaymentRepository;
import org.yellowcat.backend.product.promotionorder.PromotionProgram;
import org.yellowcat.backend.product.promotionorder.PromotionProgramRepository;
import org.yellowcat.backend.product.promotionorder.UsedPromotion;
import org.yellowcat.backend.product.promotionorder.UsedPromotionRepository;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserService;
import org.yellowcat.backend.online_selling.PaymentStatus;
import org.yellowcat.backend.product.promotionapplied.AppliedPromotionRepository;
import org.yellowcat.backend.product.promotionapplied.AppliedPromotion;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {
    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    PaymentRepository paymentRepository;
    OrderMapper orderMapper;
    AppUserService appUserService;
    PromotionProgramRepository promotionProgramRepository;
    UsedPromotionRepository usedPromotionRepository;
    AppliedPromotionRepository appliedPromotionRepository;

    public Page<OrderResponse> getOrdersByKeyword(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size);
        return orderRepository.findAllByKeyword(keyword, pageable);
    }

    public Order findOrderById(Integer orderId) {
        return orderRepository.findById(orderId).orElse(null);
    }

    public Map<String, Integer> getOrderStatusCounts() {
        List<Object[]> raw = orderRepository.countOrdersGroupByStatus();
        Map<String, Integer> result = new HashMap<>();
        for (Object[] row : raw) {
            String status = row[0] != null ? (String) row[0] : "Unknown";
            Long countLong = (Long) row[1];
            result.put(status, countLong.intValue());
        }
        return result;
    }

    public Page<OrderResponse> getOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        return orderRepository.findAllOrders(pageable);
    }

    public Page<OrderResponse> getOrderByStatus(int page, int size, String orderStatus) {
        Pageable pageable = PageRequest.of(page, size);

        return orderRepository.findAllByOrderStatus(orderStatus, pageable);
    }

    @Transactional
    public OrderUpdateResponse updateOrder(OrderUpdateRequest request) {
        // 1. Lấy danh sách OrderItem theo orderId
        List<OrderItem> orderItems = orderItemRepository.findByOrder_OrderId(request.getOrderId());

        // 2. Lấy order
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + request.getOrderId()));

        // 3. Tính subTotalAmount
        BigDecimal subTotalAmount = orderItems.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        LocalDateTime now = LocalDateTime.now();

        // 4. Áp dụng khuyến mãi tốt nhất nếu có
        List<PromotionProgram> activePromotions = promotionProgramRepository.findByIsActiveTrue();
        PromotionProgram bestPromotion = null;
        BigDecimal maxDiscount = BigDecimal.ZERO;

        for (PromotionProgram promo : activePromotions) {
            if (now.isBefore(promo.getStartDate()) || now.isAfter(promo.getEndDate()))
                continue;
            if (subTotalAmount.compareTo(promo.getMinimumOrderValue()) < 0)
                continue;
            if (promo.getUsageLimitTotal() != null) {
                int usedCount = usedPromotionRepository.countByPromotionProgram(promo);
                if (usedCount >= promo.getUsageLimitTotal())
                    continue;
            }

            BigDecimal discount;
            if ("%".equals(promo.getDiscountType())) {
                discount = subTotalAmount.multiply(promo.getDiscountValue().divide(BigDecimal.valueOf(100)));
            } else {
                discount = promo.getDiscountValue();
            }

            if (discount.compareTo(maxDiscount) > 0) {
                maxDiscount = discount;
                bestPromotion = promo;
            }
        }

        if (bestPromotion != null) {
            discountAmount = maxDiscount;

            // Kiểm tra xem đơn hàng đã có UsedPromotion nào chưa
            boolean alreadyUsed = usedPromotionRepository.existsByOrder(order);

            if (!alreadyUsed) {
                // Nếu chưa từng áp dụng -> tạo mới
                UsedPromotion usedPromotion = UsedPromotion.builder()
                        .order(order)
                        .promotionProgram(bestPromotion)
                        .quantityUsed(1)
                        .build();
                usedPromotionRepository.save(usedPromotion);

                // Giảm usageLimitTotal chỉ 1 lần
                if (bestPromotion.getUsageLimitTotal() != null) {
                    bestPromotion.setUsageLimitTotal(bestPromotion.getUsageLimitTotal() - 1);
                    promotionProgramRepository.save(bestPromotion);
                }

                System.out.println(
                        "🎁 Áp dụng khuyến mãi: " + bestPromotion.getPromotionCode() + " → Giảm " + discountAmount);
            } else {
                System.out.println("⚠️ Đơn hàng đã áp dụng khuyến mãi trước đó, không cập nhật lại.");
            }
        } else {
            System.out.println("⚠️ Không có khuyến mãi nào được áp dụng.");
        }

        // 5. Tính finalAmount
        BigDecimal finalAmount = subTotalAmount.add(shippingFee).subtract(discountAmount);

        // 6. Cập nhật các thông tin cơ bản
        if (request.getPhoneNumber() != null) {
            order.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getCustomerName() != null) {
            order.setCustomerName(request.getCustomerName());
        }
        order.setSubTotalAmount(subTotalAmount);
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(finalAmount);

        // 7. Cập nhật hoặc thêm mới payments nếu có
        boolean hasNewPayments = false;

        if (request.getPayments() != null && !request.getPayments().isEmpty()) {
            for (OrderUpdateRequest.PaymentUpdateRequest paymentReq : request.getPayments()) {
                if (paymentReq.getPaymentId() == null) {
                    hasNewPayments = true;
                    Payment payment = new Payment();
                    payment.setOrder(order);
                    payment.setAmount(paymentReq.getAmount());
                    payment.setPaymentMethod(paymentReq.getPaymentMethod());
                    payment.setTransactionId(paymentReq.getTransactionId());

                    if (paymentReq.getPaymentStatus() != null && !paymentReq.getPaymentStatus().isEmpty()) {
                        payment.setPaymentStatus(paymentReq.getPaymentStatus());
                    } else if ("CASH".equalsIgnoreCase(paymentReq.getPaymentMethod())
                            || (paymentReq.getTransactionId() != null && !paymentReq.getTransactionId().isEmpty())) {
                        payment.setPaymentStatus("COMPLETED");
                    } else {
                        payment.setPaymentStatus("PENDING");
                    }

                    paymentRepository.save(payment);
                } else {
                    hasNewPayments = true;
                    Payment existing = paymentRepository.findById(paymentReq.getPaymentId())
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Payment not found: " + paymentReq.getPaymentId()));
                    existing.setAmount(paymentReq.getAmount());
                    existing.setPaymentMethod(paymentReq.getPaymentMethod());
                    existing.setTransactionId(paymentReq.getTransactionId());

                    if (paymentReq.getPaymentStatus() != null && !paymentReq.getPaymentStatus().isEmpty()) {
                        existing.setPaymentStatus(paymentReq.getPaymentStatus());
                    } else if ("CASH".equalsIgnoreCase(paymentReq.getPaymentMethod())
                            || (paymentReq.getTransactionId() != null && !paymentReq.getTransactionId().isEmpty())) {
                        existing.setPaymentStatus("COMPLETED");
                    } else {
                        existing.setPaymentStatus("PENDING");
                    }

                    paymentRepository.save(existing);
                }
            }
        }

        // 8. Cập nhật trạng thái đơn hàng nếu có payment mới
        if (hasNewPayments) {
            List<Payment> updatedPayments = paymentRepository.findByOrder_OrderId(order.getOrderId());

            BigDecimal totalPaid = updatedPayments.stream()
                    .filter(p -> "COMPLETED".equalsIgnoreCase(p.getPaymentStatus()))
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (totalPaid.compareTo(finalAmount) >= 0) {
                order.setOrderStatus("Paid");
            } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                order.setOrderStatus("Partial");
            } else {
                order.setOrderStatus("Pending");
            }

            if (order.getPayments() == null) {
                order.setPayments(new ArrayList<>());
            }
            order.getPayments().clear();
            order.getPayments().addAll(updatedPayments);

            logPaymentInfo(order, updatedPayments, totalPaid, finalAmount);
        } else {
            List<Payment> currentPayments = paymentRepository.findByOrder_OrderId(order.getOrderId());
            if (order.getPayments() == null) {
                order.setPayments(new ArrayList<>());
            }
            order.getPayments().clear();
            order.getPayments().addAll(currentPayments);

            System.out.println("📝 Cập nhật thông tin đơn hàng không thay đổi thanh toán: " + order.getOrderCode());
        }

        // 9. Lưu order
        orderRepository.save(order);

        // 10. Trả kết quả
        return orderMapper.toOrderUpdateResponse(order);
    }

    // Tạo order mới
    public Order createOrder() {
        // Logic to create a new order for in-store sales (no shipping address)
        Order order = Order.builder()
                .orderCode(generateOrderCode())
                .orderDate(LocalDateTime.now())
                .subTotalAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO) // No shipping fee for in-store pickup
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .paymentStatus(PaymentStatus.UNPAID)
                // shippingAddress is intentionally left NULL for in-store orders
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

    @Transactional
    public void deleteOrder(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        // Xóa order (cascade sẽ tự động xóa orderItems và payments)
        orderRepository.delete(order);
    }

    OrderResponse findOrderByOrderCode(String orderCode) {
        return orderRepository.findOrderByOrderCodeOld(orderCode);
    }

    // Method mới để lấy Order với payments cho endpoint status
    @Transactional(readOnly = true)
    public OrderUpdateResponse findOrderWithPaymentsByOrderCode(String orderCode) {
        System.out.println("🔍 findOrderWithPaymentsByOrderCode called with orderCode: " + orderCode);

        OrderResponse orderResponse = orderRepository.findOrderByOrderCodeOld(orderCode);
        System.out.println("📊 orderRepository.findOrderByOrderCode result: " + orderResponse);

        if (orderResponse == null) {
            System.out.println("❌ OrderResponse is null for orderCode: " + orderCode);
            return null;
        }

        System.out.println("✅ Found order with ID: " + orderResponse.getOrderId());

        // FIX: Sử dụng query với JOIN FETCH để load payments trong cùng session
        Order order = orderRepository.findByIdWithPayments(orderResponse.getOrderId());

        if (order == null) {
            System.out.println("❌ Order entity is null for orderId: " + orderResponse.getOrderId());
            return null;
        }

        System.out.println("✅ Found Order entity: " + order.getOrderCode());
        System.out.println(
                "💳 Payments already loaded: " + (order.getPayments() != null ? order.getPayments().size() : 0));

        // Convert to OrderUpdateResponse (có payments)
        OrderUpdateResponse response = orderMapper.toOrderUpdateResponse(order);
        System.out.println("🚀 Mapped to OrderUpdateResponse successfully");

        return response;
    }

    // Method tự động xác nhận thanh toán VNPay khi callback thành công
    @Transactional
    public OrderUpdateResponse confirmVNPayPayment(String orderCode, String transactionId) {
        // Tìm order theo orderCode - FIX: check null trước khi gọi getOrderId()
        OrderResponse orderResponse = orderRepository.findOrderByOrderCodeOld(orderCode);
        if (orderResponse == null) {
            throw new IllegalArgumentException("Order not found with orderCode: " + orderCode);
        }

        // FIX: Sử dụng query với JOIN FETCH để load payments trong cùng session
        Order order = orderRepository.findByIdWithPayments(orderResponse.getOrderId());
        if (order == null) {
            throw new IllegalArgumentException("Order not found with orderCode: " + orderCode);
        }

        // Kiểm tra xem đã có payment VNPay với transactionId này chưa
        // FIX: Sử dụng payments đã được load để tránh query thêm
        List<Payment> existingPayments = order.getPayments() != null ? order.getPayments() : new ArrayList<>();
        Payment vnpayPayment = existingPayments.stream()
                .filter(p -> "VNPAY".equalsIgnoreCase(p.getPaymentMethod()) &&
                        transactionId.equals(p.getTransactionId()))
                .findFirst()
                .orElse(null);

        if (vnpayPayment == null) {
            // Tạo payment mới cho VNPay
            vnpayPayment = new Payment();
            vnpayPayment.setOrder(order);
            vnpayPayment.setAmount(order.getFinalAmount()); // Thanh toán toàn bộ số tiền
            vnpayPayment.setPaymentMethod("VNPAY");
            vnpayPayment.setTransactionId(transactionId);
            vnpayPayment.setPaymentStatus("COMPLETED");
            paymentRepository.save(vnpayPayment);

            System.out.println("Created new VNPay payment for order: " + orderCode +
                    ", transactionId: " + transactionId +
                    ", amount: " + order.getFinalAmount());
        } else if (!"COMPLETED".equalsIgnoreCase(vnpayPayment.getPaymentStatus())) {
            // Cập nhật payment đã tồn tại thành COMPLETED
            vnpayPayment.setPaymentStatus("COMPLETED");
            vnpayPayment.setAmount(order.getFinalAmount());
            paymentRepository.save(vnpayPayment);

            System.out.println("Updated existing VNPay payment to COMPLETED for order: " + orderCode +
                    ", transactionId: " + transactionId);
        } else {
            System.out.println("VNPay payment already completed for order: " + orderCode +
                    ", transactionId: " + transactionId);
        }

        // Load lại danh sách payments từ database sau khi đã thêm/cập nhật
        List<Payment> updatedPayments = paymentRepository.findByOrder_OrderId(order.getOrderId());

        // Tính tổng số tiền đã thanh toán (COMPLETED)
        BigDecimal totalPaid = updatedPayments.stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getPaymentStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Cập nhật orderStatus
        if (totalPaid.compareTo(order.getFinalAmount()) >= 0) {
            order.setOrderStatus("Paid");
        } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            order.setOrderStatus("Partial");
        } else {
            order.setOrderStatus("Pending");
        }

        // FIX: Sync lại payments collection để đảm bảo consistency
        if (order.getPayments() == null) {
            order.setPayments(new ArrayList<>());
        }
        order.getPayments().clear();
        order.getPayments().addAll(updatedPayments);

        // Log thông tin debug
        System.out.println("=== VNPAY PAYMENT CONFIRMATION ===");
        System.out.println("Order Code: " + orderCode);
        System.out.println("Transaction ID: " + transactionId);
        System.out.println("Final Amount: " + order.getFinalAmount());
        System.out.println("Total Paid: " + totalPaid);
        System.out.println("New Order Status: " + order.getOrderStatus());
        System.out.println("==================================");

        // Lưu order đã cập nhật
        orderRepository.save(order);

        // Trả về response
        return orderMapper.toOrderUpdateResponse(order);
    }

    // Method để checkin thanh toán bằng tiền mặt tại quầy
    @Transactional
    public OrderUpdateResponse checkinCashPayment(String orderCode) {
        System.out.println("🏪 checkinCashPayment called with orderCode: " + orderCode);

        // Tìm order theo orderCode
        OrderResponse orderResponse = orderRepository.findOrderByOrderCodeOld(orderCode);
        if (orderResponse == null) {
            System.out.println("❌ Order not found with orderCode: " + orderCode);
            throw new IllegalArgumentException("Order not found with orderCode: " + orderCode);
        }

        // Load order với payments
        Order order = orderRepository.findByIdWithPayments(orderResponse.getOrderId());
        if (order == null) {
            System.out.println("❌ Order entity not found with orderCode: " + orderCode);
            throw new IllegalArgumentException("Order not found with orderCode: " + orderCode);
        }

        // Kiểm tra trạng thái đơn hàng hiện tại
        if ("Paid".equalsIgnoreCase(order.getOrderStatus())) {
            System.out.println("ℹ️ Order already fully paid: " + orderCode);
            // Đơn hàng đã thanh toán đầy đủ, chỉ trả về thông tin hiện tại
            return orderMapper.toOrderUpdateResponse(order);
        }

        // Lấy danh sách payments hiện tại
        List<Payment> existingPayments = order.getPayments() != null ? order.getPayments() : new ArrayList<>();

        // Kiểm tra xem đã có payment bằng tiền mặt chưa
        Payment existingCashPayment = existingPayments.stream()
                .filter(p -> "CASH".equalsIgnoreCase(p.getPaymentMethod()))
                .findFirst()
                .orElse(null);

        // Tính tổng số tiền đã thanh toán trước đó (loại trừ CASH để tránh double
        // count)
        BigDecimal totalPaidExcludeCash = existingPayments.stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getPaymentStatus()) &&
                        !"CASH".equalsIgnoreCase(p.getPaymentMethod()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tính số tiền còn lại cần thanh toán bằng tiền mặt
        BigDecimal remainingAmount = order.getFinalAmount().subtract(totalPaidExcludeCash);

        if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            System.out.println("ℹ️ No remaining amount to pay for order: " + orderCode);
            // Không còn tiền cần thanh toán
            return orderMapper.toOrderUpdateResponse(order);
        }

        if (existingCashPayment == null) {
            // Tạo payment mới cho tiền mặt
            Payment cashPayment = new Payment();
            cashPayment.setOrder(order);
            cashPayment.setAmount(remainingAmount); // Thanh toán số tiền còn lại
            cashPayment.setPaymentMethod("CASH");
            cashPayment.setTransactionId("CASH_" + System.currentTimeMillis()); // Transaction ID đơn giản cho tiền mặt
            cashPayment.setPaymentStatus("COMPLETED"); // Tiền mặt luôn là COMPLETED khi checkin
            paymentRepository.save(cashPayment);

            System.out.println("💰 Created new CASH payment for order: " + orderCode +
                    ", amount: " + remainingAmount);
        } else {
            // Cập nhật payment tiền mặt đã tồn tại
            existingCashPayment.setAmount(remainingAmount);
            existingCashPayment.setPaymentStatus("COMPLETED");
            existingCashPayment.setTransactionId("CASH_" + System.currentTimeMillis());
            paymentRepository.save(existingCashPayment);

            System.out.println("💰 Updated existing CASH payment for order: " + orderCode +
                    ", amount: " + remainingAmount);
        }

        // Load lại danh sách payments từ database sau khi đã thêm/cập nhật
        List<Payment> updatedPayments = paymentRepository.findByOrder_OrderId(order.getOrderId());

        // Tính tổng số tiền đã thanh toán (COMPLETED)
        BigDecimal totalPaid = updatedPayments.stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getPaymentStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Cập nhật orderStatus
        if (totalPaid.compareTo(order.getFinalAmount()) >= 0) {
            order.setOrderStatus("Paid");
        } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            order.setOrderStatus("Partial");
        } else {
            order.setOrderStatus("Pending");
        }

        // Sync lại payments collection để đảm bảo consistency
        if (order.getPayments() == null) {
            order.setPayments(new ArrayList<>());
        }
        order.getPayments().clear();
        order.getPayments().addAll(updatedPayments);

        // Log thông tin debug
        System.out.println("=== CASH PAYMENT CHECKIN ===");
        System.out.println("Order Code: " + orderCode);
        System.out.println("Final Amount: " + order.getFinalAmount());
        System.out.println("Total Paid: " + totalPaid);
        System.out.println("Cash Payment Amount: " + remainingAmount);
        System.out.println("New Order Status: " + order.getOrderStatus());
        System.out.println("===========================");

        // Lưu order đã cập nhật
        orderRepository.save(order);

        // Trả về response
        return orderMapper.toOrderUpdateResponse(order);
    }

    @Transactional
    public void updateUserIDOrder(String orderCode, UUID userId) {
        AppUser appUser = appUserService
                .findByKeycloakId(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        int rows = orderRepository.updateOrderByOrderCode(orderCode, appUser.getAppUserId());
        if (rows == 0) {
            throw new EntityNotFoundException("Order not found: " + orderCode);
        }
    }

    // Method để tìm kiếm đơn hàng theo số điện thoại
    public List<OrderDetailResponse> findOrdersByPhoneNumber(String phoneNumber) {
        System.out.println("🔍 Tìm kiếm đơn hàng theo số điện thoại: " + phoneNumber);
        List<OrderDetailProjection> projections = orderRepository.findOrdersByPhoneNumber(phoneNumber);
        return projections.stream().map(this::convertToOrderDetailResponse).toList();
    }

    // Method để tìm kiếm đơn hàng theo email
    public List<OrderDetailResponse> findOrdersByEmail(String email) {
        System.out.println("🔍 Tìm kiếm đơn hàng theo email: " + email);
        List<OrderDetailProjection> projections = orderRepository.findOrdersByEmail(email);
        return projections.stream().map(this::convertToOrderDetailResponse).toList();
    }

    // Method để tìm kiếm đơn hàng theo số điện thoại hoặc email
    public List<OrderDetailResponse> findOrdersByPhoneNumberOrEmail(String searchValue) {
        System.out.println("🔍 Tìm kiếm đơn hàng theo số điện thoại hoặc email: " + searchValue);
        List<OrderDetailProjection> projections = orderRepository.findOrdersByPhoneNumberOrEmail(searchValue);
        return projections.stream().map(this::convertToOrderDetailResponse).toList();
    }

    // Method để lấy order detail với order items theo order code
    public OrderDetailWithItemsResponse getOrderDetailWithItems(String orderCode) {
        System.out.println("🔍 Lấy chi tiết đơn hàng với order items cho orderCode: " + orderCode);

        // Lấy thông tin order
        OrderDetailProjection orderProjection = orderRepository.findOrdersByPhoneNumberOrEmail(orderCode)
                .stream()
                .filter(order -> order.getOrderCode().equals(orderCode))
                .findFirst()
                .orElse(null);

        if (orderProjection == null) {
            // Thử tìm theo cách khác nếu không tìm thấy
            List<OrderDetailProjection> allOrders = orderRepository.findOrdersByPhoneNumberOrEmail("");
            orderProjection = allOrders.stream()
                    .filter(order -> order.getOrderCode().equals(orderCode))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Order not found with orderCode: " + orderCode));
        }

        // Lấy order items
        List<OrderItemDetailProjection> itemProjections = orderItemRepository
                .findOrderItemsDetailByOrderCode(orderCode);
        List<OrderItemDetailResponse> orderItems = itemProjections.stream()
                .map(this::convertToOrderItemDetailResponse)
                .toList();

        // Tính toán thống kê
        Integer totalItems = orderItems.size();
        Integer totalQuantity = orderItems.stream()
                .mapToInt(OrderItemDetailResponse::getQuantity)
                .sum();

        // Tạo response
        OrderDetailWithItemsResponse response = new OrderDetailWithItemsResponse();
        response.setOrderId(orderProjection.getOrderId());
        response.setOrderCode(orderProjection.getOrderCode());
        response.setOrderDate(orderProjection.getOrderDate());
        response.setOrderStatus(orderProjection.getOrderStatus());
        response.setCustomerName(orderProjection.getCustomerName());
        response.setPhoneNumber(orderProjection.getPhoneNumber());
        response.setFinalAmount(orderProjection.getFinalAmount());
        response.setSubTotalAmount(orderProjection.getSubTotalAmount());
        response.setShippingFee(orderProjection.getShippingFee());
        response.setDiscountAmount(orderProjection.getDiscountAmount());
        response.setShippingMethod(orderProjection.getShippingMethod());
        response.setRecipientName(orderProjection.getRecipientName());
        response.setFullAddress(orderProjection.getFullAddress());
        response.setEmail(orderProjection.getEmail());
        response.setFullName(orderProjection.getFullName());
        response.setCustomerNotes(orderProjection.getCustomerNotes());
        response.setOrderItems(orderItems);
        response.setTotalItems(totalItems);
        response.setTotalQuantity(totalQuantity);

        // Lấy thông tin voucher/mã giảm giá đã áp dụng (nếu có)
        // Lấy entity Order để truyền vào UsedPromotionRepository
        Order orderEntity = orderRepository.findById(orderProjection.getOrderId()).orElse(null);
        if (orderEntity != null) {
            UsedPromotion usedPromotion = usedPromotionRepository.findByOrder(orderEntity);
            if (usedPromotion != null && usedPromotion.getPromotionProgram() != null) {
                PromotionProgram promo = usedPromotion.getPromotionProgram();
                response.setAppliedVoucherCode(promo.getPromotionCode());
                response.setAppliedVoucherName(promo.getPromotionName());
                response.setVoucherType(promo.getDiscountType());
                response.setVoucherValue(promo.getDiscountValue());
                response.setVoucherDescription(promo.getDescription());
                // Số tiền đã giảm từ voucher = discountAmount (nếu discountAmount > 0)
                response.setVoucherDiscountAmount(orderProjection.getDiscountAmount());
            }
        }

        System.out.println("✅ Tìm thấy đơn hàng với " + totalItems + " sản phẩm, tổng " + totalQuantity + " số lượng");

        return response;
    }

    // Method đơn giản hơn để lấy order detail với order items theo order code
    @Transactional(readOnly = true)
    public OrderDetailWithItemsResponse getOrderDetailByCode(String orderCode) {
        System.out.println("🔍 Lấy chi tiết đơn hàng cho orderCode: " + orderCode);

        // Lấy thông tin order từ database
        OrderResponse orderResponse = (OrderResponse) orderRepository.findOrderByOrderCodeOld(orderCode);
        if (orderResponse == null) {
            throw new IllegalArgumentException("Order not found with orderCode: " + orderCode);
        }

        // Lấy thông tin đầy đủ của order bằng cách query lại
        Order order = orderRepository.findByIdWithPayments(orderResponse.getOrderId());
        if (order == null) {
            throw new IllegalArgumentException("Order not found with orderCode: " + orderCode);
        }

        // Lấy order items với chi tiết
        List<OrderItemDetailProjection> itemProjections = orderItemRepository
                .findOrderItemsDetailByOrderCode(orderCode);
        List<OrderItemDetailResponse> orderItems = itemProjections.stream()
                .map(this::convertToOrderItemDetailResponse)
                .toList();

        // Tính toán thống kê
        Integer totalItems = orderItems.size();
        Integer totalQuantity = orderItems.stream()
                .mapToInt(OrderItemDetailResponse::getQuantity)
                .sum();

        // Tạo response từ Order entity và order items
        OrderDetailWithItemsResponse response = new OrderDetailWithItemsResponse();
        response.setOrderId(order.getOrderId());
        response.setOrderCode(order.getOrderCode());
        response.setOrderDate(order.getOrderDate());
        response.setOrderStatus(order.getOrderStatus());
        response.setCustomerName(order.getCustomerName());
        response.setPhoneNumber(order.getPhoneNumber());
        response.setFinalAmount(order.getFinalAmount());
        response.setSubTotalAmount(order.getSubTotalAmount());
        response.setShippingFee(order.getShippingFee());
        response.setDiscountAmount(order.getDiscountAmount());

        // Lấy thông tin từ relations - Đơn hàng tại quầy không có địa chỉ giao hàng
        response.setShippingMethod("Giao tại cửa hàng"); // Fixed value for in-store orders
        response.setRecipientName(order.getCustomerName()); // Use customer name as recipient
        response.setFullAddress("Nhận tại cửa hàng - Không cần giao hàng"); // Fixed address for in-store pickup
        response.setEmail(order.getUser() != null ? order.getUser().getEmail() : null);
        response.setFullName(order.getUser() != null ? order.getUser().getFullName() : null);
        response.setCustomerNotes(order.getCustomerNotes());

        response.setOrderItems(orderItems);
        response.setTotalItems(totalItems);
        response.setTotalQuantity(totalQuantity);

        // Lấy thông tin voucher/mã giảm giá đã áp dụng (nếu có)
        System.out.println("🔍 Tìm kiếm thông tin voucher cho orderId: " + order.getOrderId());
        UsedPromotion usedPromotion = usedPromotionRepository.findByOrderWithPromotionProgram(order);
        System.out.println("📋 UsedPromotion result: " + usedPromotion);

        if (usedPromotion != null) {
            System.out.println("✅ Tìm thấy UsedPromotion với ID: " + usedPromotion.getUsedPromotionId());
            PromotionProgram promo = usedPromotion.getPromotionProgram();
            System.out.println("🎁 PromotionProgram: " + promo);

            if (promo != null) {
                System.out.println(
                        "✅ Tìm thấy PromotionProgram: " + promo.getPromotionCode() + " - " + promo.getPromotionName());
                response.setAppliedVoucherCode(promo.getPromotionCode());
                response.setAppliedVoucherName(promo.getPromotionName());
                response.setVoucherType(promo.getDiscountType());
                response.setVoucherValue(promo.getDiscountValue());
                response.setVoucherDescription(promo.getDescription());
                // Số tiền đã giảm từ voucher = discountAmount (nếu discountAmount > 0)
                response.setVoucherDiscountAmount(order.getDiscountAmount());
                System.out.println("💰 Voucher discount amount: " + order.getDiscountAmount());
            } else {
                System.out.println("❌ PromotionProgram is null");
            }
        } else {
            System.out.println("❌ Không tìm thấy UsedPromotion cho đơn hàng này");
            
            // Kiểm tra xem có item-level promotions không
            boolean hasItemPromotions = orderItems.stream()
                .anyMatch(item -> item.getPromotionCode() != null && item.getDiscountAmount() != null);
            
            System.out.println("🔍 Kiểm tra item-level promotions: " + hasItemPromotions);
            
            if (hasItemPromotions) {
                // Tính tổng discount từ items
                BigDecimal totalItemDiscount = orderItems.stream()
                    .filter(item -> item.getDiscountAmount() != null)
                    .map(OrderItemDetailResponse::getDiscountAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                System.out.println("💰 Tổng discount từ items: " + totalItemDiscount);
                
                // Lấy promotion code từ item đầu tiên có promotion
                String firstPromotionCode = orderItems.stream()
                    .filter(item -> item.getPromotionCode() != null)
                    .map(OrderItemDetailResponse::getPromotionCode)
                    .findFirst()
                    .orElse("ITEM_DISCOUNT");
                
                response.setAppliedVoucherCode(firstPromotionCode);
                response.setAppliedVoucherName("Khuyến mãi sản phẩm");
                response.setVoucherType("VND");
                response.setVoucherValue(totalItemDiscount);
                response.setVoucherDescription("Khuyến mãi được áp dụng cho các sản phẩm trong đơn hàng");
                response.setVoucherDiscountAmount(totalItemDiscount);
                
                System.out.println("✅ Đã set voucher info từ item promotions");
            } else if (order.getDiscountAmount() != null
                    && order.getDiscountAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
                System.out.println("💰 Có giảm giá nhưng không có thông tin voucher chi tiết - sử dụng fallback");

                // Fallback: Hiển thị thông tin giảm giá cơ bản
                response.setAppliedVoucherCode("DISCOUNT");
                response.setAppliedVoucherName("Giảm giá đơn hàng");
                response.setVoucherType("VND");
                response.setVoucherValue(order.getDiscountAmount());
                response.setVoucherDescription("Giảm giá đã được áp dụng cho đơn hàng này");
                response.setVoucherDiscountAmount(order.getDiscountAmount());

                System.out.println("✅ Đã set fallback voucher info với discount amount: " + order.getDiscountAmount());
            }
        }

        System.out.println("✅ Tìm thấy đơn hàng với " + totalItems + " sản phẩm, tổng " + totalQuantity + " số lượng");

        return response;
    }

    // Helper method để convert từ projection sang DTO
    private OrderDetailResponse convertToOrderDetailResponse(OrderDetailProjection projection) {
        return new OrderDetailResponse(
                projection.getOrderId(),
                projection.getOrderCode(),
                projection.getOrderDate(),
                projection.getOrderStatus(),
                projection.getCustomerName(),
                projection.getPhoneNumber(),
                projection.getFinalAmount(),
                projection.getSubTotalAmount(),
                projection.getShippingFee(),
                projection.getDiscountAmount(),
                projection.getShippingMethod(),
                projection.getRecipientName(),
                projection.getFullAddress(),
                projection.getEmail(),
                projection.getFullName(),
                projection.getCustomerNotes());
    }

    // Helper method để convert OrderItemDetailProjection sang
    // OrderItemDetailResponse
    private OrderItemDetailResponse convertToOrderItemDetailResponse(OrderItemDetailProjection projection) {
        OrderItemDetailResponse dto = new OrderItemDetailResponse();
        dto.setOrderItemId(projection.getOrderItemId());
        dto.setOrderId(projection.getOrderId());
        dto.setQuantity(projection.getQuantity());
        dto.setPriceAtPurchase(projection.getPriceAtPurchase());
        dto.setTotalPrice(projection.getTotalPrice());
        dto.setVariantId(projection.getVariantId());
        dto.setSku(projection.getSku());
        dto.setProductName(projection.getProductName());
        dto.setColorName(projection.getColorName());
        dto.setSizeName(projection.getSizeName());
        dto.setMaterialName(projection.getMaterialName());
        dto.setBrandName(projection.getBrandName());
        dto.setCategoryName(projection.getCategoryName());
        dto.setTargetAudienceName(projection.getTargetAudienceName());
        dto.setCurrentPrice(projection.getCurrentPrice());
        dto.setSalePrice(projection.getSalePrice());
        dto.setImageUrl(projection.getImageUrl());
        dto.setWeight(projection.getWeight());
        dto.setQuantityInStock(projection.getQuantityInStock());

        // Lấy applied promotion nếu có
        AppliedPromotion ap = appliedPromotionRepository.findFirstByOrderItem_OrderItemId(projection.getOrderItemId());
        if (ap != null) {
            dto.setPromotionCode(ap.getPromotionCode());
            dto.setPromotionName(ap.getPromotionName());
            dto.setDiscountAmount(ap.getDiscountAmount());
            dto.setOriginalPrice(dto.getPriceAtPurchase().add(ap.getDiscountAmount()));
        }

        return dto;
    }

    // Method để debug và log thông tin thanh toán
    private void logPaymentInfo(Order order, List<Payment> payments, BigDecimal totalPaid, BigDecimal finalAmount) {
        System.out.println("=== DEBUG PAYMENT INFO ===");
        System.out.println("Order Code: " + order.getOrderCode());
        System.out.println("Final Amount: " + finalAmount);
        System.out.println("Total Paid: " + totalPaid);
        System.out.println("Order Status: " + order.getOrderStatus());
        System.out.println("Payments count: " + (payments != null ? payments.size() : 0));

        if (payments != null) {
            for (Payment payment : payments) {
                System.out.println("Payment ID: " + payment.getPaymentId() +
                        ", Method: " + payment.getPaymentMethod() +
                        ", Amount: " + payment.getAmount() +
                        ", Status: " + payment.getPaymentStatus() +
                        ", TransactionId: " + payment.getTransactionId());
            }
        }
        System.out.println("=========================");
    }

    // Method để lấy app_user_id từ order code
    public Integer getAppUserIdByOrderCode(String orderCode) {
        return orderRepository.findAppUserIdByOrderCode(orderCode);
    }
}
