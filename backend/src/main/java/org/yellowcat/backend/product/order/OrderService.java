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
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserService;

import java.math.BigDecimal;
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

                    // Tự động cập nhật status - Cải thiện logic cho VNPAY:
                    if (paymentReq.getPaymentStatus() != null && !paymentReq.getPaymentStatus().isEmpty()) {
                        // Nếu frontend đã set status rõ ràng (như từ VNPAY callback)
                        payment.setPaymentStatus(paymentReq.getPaymentStatus());
                    } else if ("CASH".equalsIgnoreCase(paymentReq.getPaymentMethod())) {
                        // Tiền mặt luôn là COMPLETED
                        payment.setPaymentStatus("COMPLETED");
                    } else if ("VNPAY".equalsIgnoreCase(paymentReq.getPaymentMethod()) && 
                               paymentReq.getTransactionId() != null && !paymentReq.getTransactionId().isEmpty()) {
                        // VNPAY với transactionId có nghĩa là đã thanh toán thành công
                        payment.setPaymentStatus("COMPLETED");
                    } else if ("BANK_TRANSFER".equalsIgnoreCase(paymentReq.getPaymentMethod()) && 
                               paymentReq.getTransactionId() != null && !paymentReq.getTransactionId().isEmpty()) {
                        // Chuyển khoản với transactionId
                        payment.setPaymentStatus("COMPLETED");
                    } else if (paymentReq.getTransactionId() != null && !paymentReq.getTransactionId().isEmpty()) {
                        // Có transactionId thì coi như COMPLETED
                        payment.setPaymentStatus("COMPLETED");
                    } else {
                        payment.setPaymentStatus("PENDING");
                    }
                    paymentRepository.save(payment);
                } else {
                    // Payment đã tồn tại, update
                    Payment existing = paymentRepository.findById(paymentReq.getPaymentId())
                            .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentReq.getPaymentId()));
                    existing.setAmount(paymentReq.getAmount());
                    existing.setPaymentMethod(paymentReq.getPaymentMethod());
                    existing.setTransactionId(paymentReq.getTransactionId());
                    
                    // Update lại status - Cải thiện logic:
                    if (paymentReq.getPaymentStatus() != null && !paymentReq.getPaymentStatus().isEmpty()) {
                        existing.setPaymentStatus(paymentReq.getPaymentStatus());
                    } else if ("CASH".equalsIgnoreCase(paymentReq.getPaymentMethod())) {
                        existing.setPaymentStatus("COMPLETED");
                    } else if ("VNPAY".equalsIgnoreCase(paymentReq.getPaymentMethod()) && 
                               paymentReq.getTransactionId() != null && !paymentReq.getTransactionId().isEmpty()) {
                        existing.setPaymentStatus("COMPLETED");
                    } else if ("BANK_TRANSFER".equalsIgnoreCase(paymentReq.getPaymentMethod()) && 
                               paymentReq.getTransactionId() != null && !paymentReq.getTransactionId().isEmpty()) {
                        existing.setPaymentStatus("COMPLETED");
                    } else if (paymentReq.getTransactionId() != null && !paymentReq.getTransactionId().isEmpty()) {
                        existing.setPaymentStatus("COMPLETED");
                    } else {
                        existing.setPaymentStatus("PENDING");
                    }
                    paymentRepository.save(existing);
                }
            }
        }

        // QUAN TRỌNG: Load lại danh sách payments từ database sau khi đã save
        List<Payment> updatedPayments = paymentRepository.findByOrder_OrderId(order.getOrderId());
        
        // Tính tổng số tiền đã thanh toán (COMPLETED) từ danh sách mới nhất
        BigDecimal totalPaid = updatedPayments.stream()
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
        
        // FIX: Không dùng setPayments() để tránh orphan deletion error
        // Thay vào đó, clear và add lại để giữ nguyên collection reference
        if (order.getPayments() == null) {
            order.setPayments(new ArrayList<>());
        }
        order.getPayments().clear();
        order.getPayments().addAll(updatedPayments);
        
        // Debug log để kiểm tra
        logPaymentInfo(order, updatedPayments, totalPaid, finalAmount);

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

    @Transactional
    public void deleteOrder(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        // Xóa order (cascade sẽ tự động xóa orderItems và payments)
        orderRepository.delete(order);
    }

    OrderResponse findOrderByOrderCode (String orderCode) {
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
        System.out.println("💳 Payments already loaded: " + (order.getPayments() != null ? order.getPayments().size() : 0));
        
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
        
        // Tính tổng số tiền đã thanh toán trước đó (loại trừ CASH để tránh double count)
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
        List<OrderItemDetailProjection> itemProjections = orderItemRepository.findOrderItemsDetailByOrderCode(orderCode);
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
        
        System.out.println("✅ Tìm thấy đơn hàng với " + totalItems + " sản phẩm, tổng " + totalQuantity + " số lượng");
        
        return response;
    }
    
    // Method đơn giản hơn để lấy order detail với order items theo order code
    @Transactional(readOnly = true)
    public OrderDetailWithItemsResponse getOrderDetailByCode(String orderCode) {
        System.out.println("🔍 Lấy chi tiết đơn hàng cho orderCode: " + orderCode);
        
        // Lấy thông tin order từ database
        OrderResponse orderResponse = orderRepository.findOrderByOrderCodeOld(orderCode);
        if (orderResponse == null) {
            throw new IllegalArgumentException("Order not found with orderCode: " + orderCode);
        }
        
        // Lấy thông tin đầy đủ của order bằng cách query lại
        Order order = orderRepository.findByIdWithPayments(orderResponse.getOrderId());
        if (order == null) {
            throw new IllegalArgumentException("Order not found with orderCode: " + orderCode);
        }
        
        // Lấy order items với chi tiết
        List<OrderItemDetailProjection> itemProjections = orderItemRepository.findOrderItemsDetailByOrderCode(orderCode);
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
        
        // Lấy thông tin từ relations
        response.setShippingMethod(order.getShippingMethod() != null ? order.getShippingMethod().getMethodName() : null);
        response.setRecipientName(order.getShippingAddress() != null ? order.getShippingAddress().getRecipientName() : null);
        response.setFullAddress(order.getShippingAddress() != null ? 
            String.format("%s, %s, %s, %s", 
                order.getShippingAddress().getStreetAddress(),
                order.getShippingAddress().getWardCommune(),
                order.getShippingAddress().getDistrict(),
                order.getShippingAddress().getCityProvince()) : null);
        response.setEmail(order.getUser() != null ? order.getUser().getEmail() : null);
        response.setFullName(order.getUser() != null ? order.getUser().getFullName() : null);
        response.setCustomerNotes(order.getCustomerNotes());
        
        response.setOrderItems(orderItems);
        response.setTotalItems(totalItems);
        response.setTotalQuantity(totalQuantity);
        
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
            projection.getCustomerNotes()
        );
    }

    // Helper method để convert OrderItemDetailProjection sang OrderItemDetailResponse
    private OrderItemDetailResponse convertToOrderItemDetailResponse(OrderItemDetailProjection projection) {
        return new OrderItemDetailResponse(
            projection.getOrderItemId(),
            projection.getOrderId(),
            projection.getQuantity(),
            projection.getPriceAtPurchase(),
            projection.getTotalPrice(),
            projection.getVariantId(),
            projection.getSku(),
            projection.getProductName(),
            projection.getColorName(),
            projection.getSizeName(),
            projection.getMaterialName(),
            projection.getBrandName(),
            projection.getCategoryName(),
            projection.getTargetAudienceName(),
            projection.getCurrentPrice(),
            projection.getSalePrice(),
            projection.getImageUrl(),
            projection.getWeight(),
            projection.getQuantityInStock()
        );
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
}
