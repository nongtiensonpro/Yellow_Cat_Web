package org.yellowcat.backend.online_selling.oder_online;


import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.address.AddressRepository;
import org.yellowcat.backend.address.Addresses;
import org.yellowcat.backend.online_selling.PaymentStatus;
import org.yellowcat.backend.online_selling.cardItem_online.CartItemOnlineRepository;
import org.yellowcat.backend.online_selling.card_online.CartOnlineRepository;
import org.yellowcat.backend.online_selling.gmail_sending.EmailService;
import org.yellowcat.backend.online_selling.oder_online.dto.OrderOnlineDetailDTO;
import org.yellowcat.backend.online_selling.oder_online.dto.OrderOnlineRequestDTO;
import org.yellowcat.backend.online_selling.oder_online.dto.OrderSummaryDTO;
import org.yellowcat.backend.online_selling.oder_online.dto.ProductOnlineDTO;
import org.yellowcat.backend.online_selling.orderTimeline.OrderTimeline;
import org.yellowcat.backend.online_selling.orderTimeline.OrderTimelineRepository;
import org.yellowcat.backend.online_selling.orderTimeline.OrderTimelineService;
import org.yellowcat.backend.online_selling.order_item_online.OrderItemOnlineDTO;
import org.yellowcat.backend.online_selling.voucher.VoucherService1;
import org.yellowcat.backend.product.cartItem.CartItem;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.orderItem.OrderItemRepository;
import org.yellowcat.backend.product.payment.Payment;
import org.yellowcat.backend.product.payment.PaymentRepository;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.product.shippingMethod.ShippingMethod;
import org.yellowcat.backend.product.shippingMethod.ShippingMethodRepository;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;
import org.yellowcat.backend.online_selling.voucher.entity.VoucherRedemption;
import org.yellowcat.backend.online_selling.voucher.repository.VoucherRedemptionRepository;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
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
    private final ShippingMethodRepository shippingMethodRepository;
    private final VoucherService1 voucherService1;
    private final VoucherRedemptionRepository voucherRedemptionRepository;
    private final EmailService emailService;

    @Autowired
    OrderTimelineService orderTimelineService;

    @Autowired
    OderOnlineRepository orderOnlineRepository;

    /**
     * Tạo đơn hàng từ yêu cầu đặt hàng online
     * 
     * Chức năng:
     * 1. Xử lý danh sách sản phẩm và tính tổng tiền
     * 2. Áp dụng voucher nếu có (tính giảm giá)
     * 3. Tính phí ship và tổng tiền cuối cùng
     * 4. Tạo đơn hàng với đầy đủ thông tin
     * 5. Lưu payment, timeline và xóa sản phẩm khỏi giỏ hàng
     * 
     * @param request DTO chứa thông tin đơn hàng từ frontend
     * @return Order đã được tạo và lưu vào database
     */
    @Transactional
    public Order createOrderFromOnlineRequest(OrderOnlineRequestDTO request) {
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subTotal = BigDecimal.ZERO;
        BigDecimal discountAfterAmount = BigDecimal.ZERO;

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

        // Logic tính toán tổng tiền rõ ràng
        BigDecimal finalAmount;
        BigDecimal subTotal_use_voucher;
        boolean hasVoucher = request.getCodeVoucher() != null && !request.getCodeVoucher().trim().isEmpty();

        if (hasVoucher) {
            // CÓ VOUCHER: Tính theo logic voucher
            discountAfterAmount = voucherService1.calculateDiscountedAmount(
                    request.getCodeVoucher(), subTotal, shippingFee
            );
            subTotal_use_voucher = subTotal.subtract(discountAfterAmount);
            finalAmount = subTotal_use_voucher.add(shippingFee);
        } else {
            // KHÔNG CÓ VOUCHER: Tổng tiền sản phẩm + phí ship
            discountAfterAmount = BigDecimal.ZERO;
            subTotal_use_voucher = subTotal;
            finalAmount = subTotal.add(shippingFee);
        }

        // Tìm hoặc tạo AppUser
        AppUser user = null;
        if (request.getAppUser() != null && request.getAppUser().getKeycloakId() != null) {
            UUID keycloakId = request.getAppUser().getKeycloakId();
            String email = request.getAppUser().getEmail();

            System.out.println("🔍 Đang tìm user bằng keycloakId: " + keycloakId);

            Optional<AppUser> optionalUser = appUserRepository.findByKeycloakId(keycloakId);

            if (optionalUser.isPresent()) {
                user = optionalUser.get();
                System.out.println("✅ Tìm thấy user trong DB: "
                        + "appUserId=" + user.getAppUserId()
                        + ", username=" + user.getUsername()
                        + ", email=" + user.getEmail());
            } else {
                System.out.println("❌ Không tìm thấy user với keycloakId: " + keycloakId);

                // Check theo email
                if (email != null && !email.isBlank()) {
                    Optional<AppUser> optionalUserByMail = appUserRepository.findByEmail(email);

                    if (optionalUserByMail.isPresent()) {
                        AppUser existingUser = optionalUserByMail.get();

                        if (existingUser.getRoles().contains("GUEST")) {
                            // 👉 Nếu user này là GUEST thì tái sử dụng
                            user = existingUser;
                            System.out.println("♻️ Tái sử dụng GUEST user với email: " + email
                                    + ", appUserId=" + user.getAppUserId());
                        } else {
                            // 👉 Nếu user không phải GUEST thì báo lỗi
                            throw new RuntimeException("Email " + email + " đã được đăng ký trong hệ thống. Vui lòng đăng nhập để tiếp tục.");
                        }
                    }
                }

                // Nếu email chưa tồn tại → tạo guest user mới
                if (user == null) {
                    System.out.println("🆕 Tạo mới GUEST user (vì không tồn tại keycloakId và email chưa được đăng ký)");
                    user = new AppUser();
                    user.setFullName(request.getShippingAddress().getRecipientName());
                    user.setEmail(email);
                    user.setEnabled(true);
                    user.setRoles(List.of("GUEST"));

                    user = appUserRepository.save(user);
                    System.out.println("✅ Guest user được tạo với appUserId: " + user.getAppUserId());
                }
            }
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

        ShippingMethod shippingOption = shippingMethodIdRepository.findById(request.getShippingMethodId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phương thức giao hàng với ID: " + request.getShippingMethodId()));

        // Tạo đơn hàng

        Order order = Order.builder()
                .orderCode(generateOrderCode())
                .user(user)
                .shippingAddress(shippingAddress)
                .phoneNumber(request.getShippingAddress().getPhoneNumber())
                .customerName(request.getShippingAddress().getRecipientName())
                .subTotalAmount(subTotal)
                .shippingFee(shippingFee)
                .discountAmount(discountAfterAmount)
                .finalAmount(finalAmount)
                .customerNotes(request.getNote())
                .orderItems(orderItems)
                .orderDate(LocalDateTime.now())
                .orderStatus(request.getOrderStatus() != null && !request.getOrderStatus().isBlank()
                        ? request.getOrderStatus()
                        : "Pending")
                .isSyncedToGhtk(false)
                .shippingMethod(shippingOption)
                .createdAt(LocalDateTime.now())
                .build();

        // Gán order vào từng orderItem trước khi lưu
        orderItems.forEach(i -> i.setOrder(order));

        // Lưu order
        Order savedOrder = orderRepository.save(order);



        // gắn voucher cho đơn hàng
        if(request.getCodeVoucher() != null) {
            voucherService1.applyVoucher(request.getCodeVoucher(), savedOrder, user != null ? user.getAppUserId() : null);
        }

        // Tạo timeline
        OrderTimeline timeline = new OrderTimeline();
        timeline.setNote(request.getNote());
        timeline.setFromStatus(request.getOrderStatus());
        timeline.setToStatus(request.getOrderStatus());
        timeline.setChangedAt(LocalDateTime.now());
        timeline.setOrderId(savedOrder.getOrderId());
        timeline.setUpdatedBy(user != null ? user.getAppUserId() : null);
        orderTimelineRepository.save(timeline);

        //Lưu phương thức thanh toán
        Payment payment = new Payment();
        payment.setAmount(finalAmount);  // Sửa: Lưu finalAmount thay vì subTotal
        payment.setOrder(order);
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setPaymentStatus("Pending");

        Payment savedPayment = paymentRepository.save(payment);

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

        // Gửi mail xác nhận đơn hàng
        emailService.sendNewOrderConfirmationEmail(savedOrder);

        return savedOrder;
    }

    /**
     * Sinh mã đơn hàng tự động
     * 
     * Chức năng:
     * - Tạo mã đơn hàng duy nhất theo format HDxxxxx
     * - HD = Hóa Đơn, xxxxx = số ngẫu nhiên từ 10000-99999
     * 
     * @return String mã đơn hàng (ví dụ: HD12345)
     */
    private String generateOrderCode() {
        int randomNum = 10000 + new Random().nextInt(90000);
        return String.format("HD%d", randomNum);
    }

    /**
     * Hủy đơn hàng và hoàn kho
     * 
     * Chức năng:
     * 1. Kiểm tra đơn hàng có tồn tại không
     * 2. Kiểm tra đơn hàng có ở trạng thái 'Pending' không
     * 3. Hoàn kho: cộng lại số lượng sản phẩm vào kho
     * 4. Cập nhật trạng thái đơn hàng thành 'Cancelled'
     * 
     * @param orderId ID của đơn hàng cần hủy
     * @return Order đã được cập nhật trạng thái
     * @throws RuntimeException nếu đơn hàng không tồn tại hoặc không thể hủy
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
     * Tìm đơn hàng theo mã đơn hàng
     * 
     * Chức năng:
     * - Tìm kiếm đơn hàng trong database theo mã đơn hàng (orderCode)
     * 
     * @param orderCode Mã đơn hàng cần tìm (ví dụ: HD12345)
     * @return Order nếu tìm thấy, null nếu không tìm thấy
     */
    public Order getOrderByOrderCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode);
        return order;
    }

    /**
     * Lấy danh sách tất cả đơn hàng online có địa chỉ giao hàng
     * 
     * Chức năng:
     * - Lấy tất cả đơn hàng có shipping address (đơn hàng online)
     * - Sắp xếp theo thời gian cập nhật mới nhất
     * - Chuyển đổi thành DTO để trả về frontend
     * 
     * @return List<OrderSummaryDTO> danh sách đơn hàng online
     */
    @Transactional
    public List<OrderSummaryDTO> getAllOnlineOrdersWithShipping() {
        List<Order> orders = orderRepository.findByShippingAddressIsNotNullOrderByUpdatedAtDesc();

        return orders.stream().map(order -> OrderSummaryDTO.builder()
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .orderStatus(order.getOrderStatus())
                .customerName(order.getCustomerName())
                .finalAmount(order.getFinalAmount())
                .discountAmount(order.getDiscountAmount())
                .createdAt(order.getOrderDate())
                .updatedAt(order.getUpdatedAt())
                .build()
        ).toList();
    }

    /**
     * Lấy danh sách đơn hàng online theo trạng thái
     * 
     * Chức năng:
     * - Lọc đơn hàng online theo trạng thái cụ thể
     * - Chỉ lấy đơn hàng có shipping address (đơn hàng online)
     * - Sắp xếp theo thời gian cập nhật mới nhất
     * 
     * @param orderStatus Trạng thái đơn hàng cần lọc (ví dụ: "Pending", "Completed")
     * @return List<OrderSummaryDTO> danh sách đơn hàng theo trạng thái
     */
    @Transactional
    public List<OrderSummaryDTO> getOnlineOrdersByStatus(String orderStatus) {
        List<Order> orders = orderRepository.findByShippingAddressIsNotNullAndOrderStatusOrderByUpdatedAtDesc(orderStatus);

        return orders.stream().map(order -> OrderSummaryDTO.builder()
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .customerName(order.getCustomerName())
                .orderStatus(order.getOrderStatus())
                .finalAmount(order.getFinalAmount())
                .discountAmount(order.getDiscountAmount())
                .createdAt(order.getOrderDate())
                .updatedAt(order.getUpdatedAt())
                .build()
        ).toList();
    }

    /**
     * Lấy danh sách đơn hàng theo nhóm trạng thái
     * 
     * Chức năng:
     * - Phân loại đơn hàng theo nhóm trạng thái logic
     * - userRequestStatuses: Đơn hàng cần xử lý từ phía khách hàng
     * - adminProcessingStatuses: Đơn hàng đang được admin xử lý
     * - userTrackingStatuses: Đơn hàng khách hàng có thể theo dõi
     * - completedStatuses: Đơn hàng đã hoàn thành
     * 
     * @param groupKey Tên nhóm trạng thái cần lấy
     * @return List<OrderSummaryDTO> danh sách đơn hàng theo nhóm
     * @throws IllegalArgumentException nếu groupKey không hợp lệ
     */
    @Transactional
    public List<OrderSummaryDTO> getOrdersByStatusGroup(String groupKey) {
        List<String> statuses;

        switch (groupKey) {
            case "userRequestStatuses" -> statuses = List.of(
                    "Cancelled", "ReturnRequested", "NotReceivedReported", "Dispute", "CustomerReceived");
            case "adminProcessingStatuses" -> statuses = List.of(
                    "Pending", "Confirmed", "Processing", "Investigation",
                    "DeliveryFailed1", "DeliveryFailed2", "DeliveryFailed3", "IncidentReported", "LostOrDamaged",
                    "CustomerDecisionPending", "ReturnApproved", "ReturnRejected", "ReturnedToWarehouse",
                    "ReturnedToSeller", "Refunded", "FinalRejected");
            case "userTrackingStatuses" -> statuses = List.of(
                    "Confirmed", "Processing", "Shipping", "Delivered", "ReturningInProgress");
            case "completedStatuses" -> statuses = List.of(
                    "Completed", "Refunded", "FinalRejected", "ReturnedToSeller", "Cancelled");
            default -> throw new IllegalArgumentException("Nhóm trạng thái không hợp lệ: " + groupKey);
        }

        return orderRepository.findByOrderStatusIn(statuses)
                .stream()
                .map(this::convertToSummary)
                .toList();
    }


    /**
     * Chuyển đổi Order entity thành OrderSummaryDTO
     * 
     * Chức năng:
     * - Chuyển đổi dữ liệu từ Order entity sang DTO
     * - Chỉ lấy các thông tin cần thiết cho danh sách đơn hàng
     * - Giảm thiểu dữ liệu truyền tải
     * 
     * @param order Order entity cần chuyển đổi
     * @return OrderSummaryDTO chứa thông tin tóm tắt đơn hàng
     */
    private OrderSummaryDTO convertToSummary(Order order) {
        return OrderSummaryDTO.builder()
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .customerName(order.getCustomerName())
                .orderStatus(order.getOrderStatus())
                .finalAmount(order.getFinalAmount())
                .discountAmount(order.getDiscountAmount())
                .createdAt(order.getOrderDate())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    /**
     * Lấy chi tiết đơn hàng online
     * 
     * Chức năng:
     * 1. Tìm đơn hàng theo ID
     * 2. Chuyển đổi OrderItems thành DTO
     * 3. Lấy thông tin địa chỉ giao hàng
     * 4. Lấy thông tin payment
     * 5. Tạo OrderOnlineDetailDTO với đầy đủ thông tin
     * 
     * @param orderId ID của đơn hàng cần lấy chi tiết
     * @return OrderOnlineDetailDTO chứa thông tin chi tiết đơn hàng
     * @throws RuntimeException nếu không tìm thấy đơn hàng
     */
    @Transactional
    public OrderOnlineDetailDTO getOrderDetail(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        List<OrderItemOnlineDTO> itemDTOs = order.getOrderItems().stream().map(item -> OrderItemOnlineDTO.builder()
                .productId(item.getVariant().getProduct().getProductId())
                .productName(item.getVariant().getProduct().getProductName())
                .variantName(item.getVariant().getProduct().getProductName()) // hoặc getVariantName() nếu có sẵn
                .quantity(item.getQuantity())
                .unitPrice(item.getPriceAtPurchase())
                .totalPrice(item.getTotalPrice())
                .build()).toList();

        Addresses address = addressRepository.findByAddressId(order.getShippingAddress().getAddressId());
        Payment payment= paymentRepository.findByOrder(order);

        // Lấy thông tin voucher nếu có
        String voucherCode = null;
        if (order.getDiscountAmount() != null && order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                    // Tìm voucher đã áp dụng cho đơn hàng này
        try {
            VoucherRedemption redemption = voucherRedemptionRepository.findByOrderId(order.getOrderId());
            if (redemption != null && redemption.getVoucher() != null) {
                voucherCode = redemption.getVoucher().getCode();
                System.out.println("✅ Tìm thấy mã voucher: " + voucherCode);
            } else {
                System.out.println("❌ Không tìm thấy voucher cho đơn hàng: " + order.getOrderId());
            }
        } catch (Exception e) {
            System.out.println("❌ Lỗi khi lấy mã voucher cho đơn hàng: " + order.getOrderId() + " - " + e.getMessage());
        }
        }

        return OrderOnlineDetailDTO.builder()
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .orderStatus(order.getOrderStatus())
                .customerName(order.getCustomerName())
                .phoneNumber(order.getPhoneNumber())
                .wardCommune(address.getWardCommune())
                .streetAddress(address.getStreetAddress())
                .district(address.getDistrict())
                .cityProvince(address.getCityProvince())
                .country(address.getCountry())
                .orderDate(order.getOrderDate())
                .subTotal(order.getSubTotalAmount())
                .shippingFee(order.getShippingFee())
                .voucherDiscount(order.getDiscountAmount())
                .voucherCode(voucherCode)
                .finalAmount(order.getFinalAmount())
                .paymentStatus(payment.getPaymentStatus())
                .paymentMethod(payment.getPaymentMethod())
                .items(itemDTOs)
                .customerNotes(order.getCustomerNotes())
                .build();
    }

    /**
     * Lấy danh sách đơn hàng online của một người dùng
     * 
     * Chức năng:
     * 1. Tìm người dùng theo keycloakId
     * 2. Lấy tất cả đơn hàng của người dùng đó
     * 3. Lọc chỉ lấy đơn hàng online (có shipping address)
     * 4. Sắp xếp theo thời gian đặt hàng mới nhất
     * 
     * @param keycloakId UUID của người dùng từ Keycloak
     * @return List<OrderSummaryDTO> danh sách đơn hàng online của người dùng
     * @throws RuntimeException nếu không tìm thấy người dùng
     */
    @Transactional
    public List<OrderSummaryDTO> getOrdersByUser(UUID keycloakId) {
        AppUser user = appUserRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với keycloakId: " + keycloakId));

        List<Order> orders = orderRepository.findByUserOrderByOrderDateDesc(user);
        List<Order> ordersOnline = new ArrayList<>();
        for (Order order : orders) {
            if (order.getShippingAddress() != null && order.getShippingAddress().getAddressId() != null) {
                ordersOnline.add(order);
            }
        }

        return ordersOnline.stream().map(this::convertToSummary).toList();
    }

    /**
     * Lấy danh sách đơn hàng online của người dùng theo trạng thái
     * 
     * Chức năng:
     * 1. Tìm người dùng theo keycloakId
     * 2. Lấy đơn hàng của người dùng theo trạng thái cụ thể
     * 3. Lọc chỉ lấy đơn hàng online (có shipping address)
     * 4. Trả về danh sách rỗng nếu không tìm thấy người dùng
     * 
     * @param keycloakId UUID của người dùng từ Keycloak
     * @param orderStatus Trạng thái đơn hàng cần lọc
     * @return List<OrderSummaryDTO> danh sách đơn hàng theo trạng thái, rỗng nếu không tìm thấy người dùng
     */
    @Transactional
    public List<OrderSummaryDTO> getOrderStatus(UUID keycloakId, String orderStatus) {
        Optional<AppUser> userOpt = appUserRepository.findByKeycloakId(keycloakId);
        if (userOpt.isEmpty()) {
            return Collections.emptyList();
        }
        AppUser user = userOpt.get();
        List<Order> orders = orderRepository.findByUserAndOrderStatus(user, orderStatus);
        List<Order> ordersOnline = new ArrayList<>();
        for (Order order : orders) {
            if (order.getShippingAddress() != null && order.getShippingAddress().getAddressId() != null) {
                ordersOnline.add(order);
            }
        }
        return ordersOnline.stream().map(this::convertToSummary).toList();
    }
}
