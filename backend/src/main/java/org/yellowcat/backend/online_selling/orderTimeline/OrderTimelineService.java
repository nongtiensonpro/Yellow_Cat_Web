package org.yellowcat.backend.online_selling.orderTimeline;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.online_selling.image_of_order_timeline.ImageRepository;
import org.yellowcat.backend.online_selling.image_of_order_timeline.OrderTimelineImage;
import org.yellowcat.backend.online_selling.oder_online.OderOnlineRepository;
import org.yellowcat.backend.online_selling.orderTimeline.dto.DetailOrderTimeLine;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.payment.Payment;
import org.yellowcat.backend.product.payment.PaymentRepository;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;
import org.yellowcat.backend.zalopay.ZaloPayService;
import java.util.stream.Collectors;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderTimelineService {

    private final OrderTimelineRepository orderTimelineRepository;
    private final OderOnlineRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ImageRepository imageRepository;
    private final AppUserRepository appUserRepository;
    private final ZaloPayService zaloPayService;

    private static final int RETURN_ALLOWED_DAYS = 3;

    @Transactional
    public Map<String, Object> updateOrderStatus(Integer orderId, String newStatus, String note, List<String> imageUrls, UUID keycloakid) {
        Integer userid = appUserRepository.findByKeycloakId(keycloakid).get().getAppUserId();

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        var payment = paymentRepository.findByOrder(order);
        String paymentStatus = (payment != null) ? payment.getPaymentStatus() : "Pending";
        String currentStatus = order.getOrderStatus();

        if (currentStatus.equalsIgnoreCase(newStatus)) {
            throw new RuntimeException("Đơn hàng đã ở trạng thái này rồi.");
        }

        if (isTerminalStatus(currentStatus, payment)) {
            throw new RuntimeException("Không thể thay đổi trạng thái của đơn hàng đã kết thúc.");
        }

        if ("Delivered".equalsIgnoreCase(currentStatus) && "ReturnRequested".equalsIgnoreCase(newStatus)) {
            Optional<OrderTimeline> delivered = orderTimelineRepository.findFirstByOrderIdAndToStatusOrderByChangedAtAsc(orderId, "Delivered");
            if (delivered.isEmpty() || delivered.get().getChangedAt().plusDays(RETURN_ALLOWED_DAYS).isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Không đủ điều kiện để hoàn hàng.");
            }
            // Bỏ kiểm tra paymentStatus để cho phép hoàn hàng cả khi chưa thanh toán
            // if ("Pending".equals(paymentStatus)) {
            //     throw new RuntimeException("Đơn hàng chưa thanh toán. Vui lòng liên hệ cửa hàng để xử lý.");
            // }
        }

        if ("Pending".equalsIgnoreCase(currentStatus) && "Cancelled".equalsIgnoreCase(newStatus)) {
            restockOrderItems(order);
            refundIfNeeded(order, "Hoàn tiền hủy đơn ở trạng thái PENDING");
        }

        if ("ReturnedToSeller".equalsIgnoreCase(newStatus)) {
            restockOrderItems(order);
            // Nếu là ZALOPAY và đã thanh toán thành công, tự động chuyển tiếp sang Refunded
            if (payment != null && "ZALOPAY".equalsIgnoreCase(payment.getPaymentMethod()) && "SUCCESS".equalsIgnoreCase(paymentStatus)) {
                // Lưu timeline cho ReturnedToSeller trước
                String finalNote = (note == null || note.trim().isEmpty()) ? "Không có ghi chú." : note;
                saveTimeline(orderId, currentStatus, newStatus, finalNote, imageUrls,userid);
                order.setOrderStatus("Refunded");
                orderRepository.save(order);
                saveTimeline(orderId, newStatus, "Refunded", "Tự động hoàn tiền cho đơn ZaloPay đã trả về người bán", null,userid);
                Map<String, Object> response = new HashMap<>();
                response.put("orderId", orderId);
                response.put("fromStatus", currentStatus);
                response.put("toStatus", "Refunded");
                response.put("message", "Chuyển trạng thái đơn hàng thành công từ '" + currentStatus + "' sang 'Refunded'.");
                return response;
            }
        }

        if ("CustomerReceived".equalsIgnoreCase(newStatus)) {
            updateCodPaymentStatus(order);
        }

        if ("Cancelled".equalsIgnoreCase(newStatus)) {
            refundIfNeeded(order, "Hoàn tiền hủy đơn hàng");
        }

        // CHẶN Refunded nếu chưa thanh toán
        if ("Refunded".equalsIgnoreCase(newStatus)) {
            if (!"SUCCESS".equalsIgnoreCase(paymentStatus)) {
                throw new RuntimeException("Chỉ đơn hàng đã thanh toán mới được chuyển sang trạng thái Refunded.");
            }
        }

        if ("Completed".equalsIgnoreCase(newStatus) && !"CustomerReceived".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Chỉ có thể hoàn tất đơn hàng sau khi khách hàng xác nhận đã nhận hàng.");
        } else if ("Completed".equalsIgnoreCase(newStatus)) {
            order.getOrderItems().forEach(item -> {
                var variant = item.getVariant();
                Integer currentSold = variant.getSold() != null ? variant.getSold() : 0;
                variant.setSold(currentSold + item.getQuantity());
            });
        }

        order.setOrderStatus(newStatus);
        orderRepository.save(order);

        String finalNote = (note == null || note.trim().isEmpty()) ? "Không có ghi chú." : note;
        saveTimeline(orderId, currentStatus, newStatus, finalNote, imageUrls, userid);

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", orderId);
        response.put("fromStatus", currentStatus);
        response.put("toStatus", newStatus);
        response.put("message", "Chuyển trạng thái đơn hàng thành công từ '" + currentStatus + "' sang '" + newStatus + "'.");
        return response;
    }

    @Transactional
    public void checkWaitingOrdersAndUpdateStockForVariants(List<Integer> variantIds) {
        List<Order> waitingOrders = orderRepository.findWaitingOrdersByVariantIds(variantIds);

        for (Order order : waitingOrders) {
            boolean canFulfill = order.getOrderItems().stream().allMatch(item -> {
                ProductVariant variant = item.getVariant();
                return variant.getQuantityInStock() >= item.getQuantity();
            });

            if (canFulfill) {
                order.getOrderItems().forEach(item -> {
                    ProductVariant variant = item.getVariant();
                    variant.setQuantityInStock(variant.getQuantityInStock() - item.getQuantity());
                });
                String previousStatus = order.getOrderStatus();
                order.setOrderStatus("Pending");
                orderRepository.save(order);
                saveTimeline(
                        order.getOrderId(),
                        previousStatus,
                        "Pending",
                        "Đủ hàng và tự động chuyển sang trạng thái chờ xác nhận.",
                        null,
                        null
                );
            }
        }
    }


    @Transactional
    public Map<String, Object> confirmCustomerReceived(Integer orderId, String note) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng."));

        Integer id = order.getUser().getAppUserId();

        if (!"Delivered".equalsIgnoreCase(order.getOrderStatus())) {
            throw new RuntimeException("Chỉ có thể xác nhận nhận hàng sau khi đã giao.");
        }

        // Kiểm tra nếu là ZALOPAY mà chưa thanh toán thì không cho xác nhận
        Payment payment = paymentRepository.findByOrder(order);
        if (payment != null && "ZALOPAY".equalsIgnoreCase(payment.getPaymentMethod()) && !"SUCCESS".equalsIgnoreCase(payment.getPaymentStatus())) {
            throw new RuntimeException("Đơn hàng thanh toán qua ZaloPay nhưng chưa thanh toán thành công, không thể xác nhận đã nhận hàng.");
        }

        order.setOrderStatus("CustomerReceived");
        orderRepository.save(order);

        // Cập nhật thanh toán COD nếu có
        updateCodPaymentStatus(order);

        String finalNote = (note == null || note.trim().isEmpty()) ? "Khách hàng xác nhận đã nhận hàng." : note;
        saveTimeline(orderId, "Delivered", "CustomerReceived", finalNote, null,id);

        Map<String, Object> res = new HashMap<>();
        res.put("orderId", orderId);
        res.put("fromStatus", "Delivered");
        res.put("toStatus", "CustomerReceived");
        res.put("message", "Khách hàng xác nhận đã nhận hàng.");
        return res;
    }

    @Scheduled(cron = "0 0 12 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void autoMarkCustomerReceived() {
        LocalDateTime deadline = LocalDateTime.now().minusDays(3);
        List<OrderTimeline> deliveredTimelines = orderTimelineRepository.findByToStatusAndChangedAtBefore("Delivered", deadline);

        for (OrderTimeline timeline : deliveredTimelines) {
            Integer orderId = timeline.getOrderId();
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null && "Delivered".equalsIgnoreCase(order.getOrderStatus())) {
                order.setOrderStatus("CustomerReceived");
                orderRepository.save(order);

                // Cập nhật thanh toán COD nếu có
                updateCodPaymentStatus(order);

                saveTimeline(orderId, "Delivered", "CustomerReceived", "Tự động xác nhận sau 3 ngày kể từ khi nhận hàng", null,null);
            }
        }
    }

    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Ho_Chi_Minh") // Chạy mỗi giờ tại phút 0
    @Transactional
    public void autoCancelUnpaidOrders() {
        // Thời gian chờ: 24 giờ
        ZoneId vietnamZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDateTime cutoffTime = LocalDateTime.now(vietnamZone).minusHours(24);

        log.info("Bắt đầu kiểm tra đơn chưa thanh toán sau 24 giờ...");
        log.info("Mốc thời gian hủy: {}", cutoffTime);

        // Lấy tất cả đơn online chưa thanh toán sau 24 giờ
        List<Order> unpaidOrders = orderRepository.findUnpaidOrders(
                Arrays.asList("ZaloPay", "MoMo", "VNPay"), // Tất cả phương thức online
                "Pending",
                "pending",
                cutoffTime
        );

        log.info("Tìm thấy {} đơn cần hủy", unpaidOrders.size());

        for (Order order : unpaidOrders) {
            try {
                log.info("Hủy đơn: {} - Tạo lúc: {}", order.getOrderCode(), order.getCreatedAt());

                updateOrderStatus(
                        order.getOrderId(),
                        "Cancelled",
                        "Tự động hủy do không thanh toán sau 24 giờ",
                        null,
                        null
                );

                log.info("Đã hủy thành công đơn: {}", order.getOrderCode());
            } catch (Exception e) {
                log.error("Lỗi khi hủy đơn {}: {}", order.getOrderId(), e.getMessage(), e);
            }
        }
    }

    public void saveTimeline(Integer orderId, String fromStatus, String toStatus, String note, List<String> imageUrls, Integer id) {
        OrderTimeline timeline = new OrderTimeline(orderId, fromStatus, toStatus, note, LocalDateTime.now(), id);
        orderTimelineRepository.save(timeline);
        if (imageUrls != null) {
            for (String url : imageUrls) {
                if (url != null && !url.trim().isEmpty()) {
                    OrderTimelineImage image = new OrderTimelineImage();
                    image.setOrderTimeline(timeline);
                    image.setImageUrl(url);
                    imageRepository.save(image);
                }
            }
        }
    }

    public List<DetailOrderTimeLine> getTimelineByOrderId(Integer orderId) {
        List<OrderTimeline> timelines = orderTimelineRepository.findByOrderIdOrderByChangedAtAsc(orderId);

        return timelines.stream()
                .map(this::convertToDetailOrderTimeLine)
                .collect(Collectors.toList());
    }

    private DetailOrderTimeLine convertToDetailOrderTimeLine(OrderTimeline timeline) {
        AppUser user = null;

        if (timeline.getUpdatedBy() != null) {
            user = appUserRepository.findById(timeline.getUpdatedBy()).orElse(null);
        }

        return DetailOrderTimeLine.builder()
                .id(timeline.getId())
                .orderId(timeline.getOrderId())
                .fromStatus(timeline.getFromStatus())
                .toStatus(timeline.getToStatus())
                .note(timeline.getNote())
                .changedAt(timeline.getChangedAt())
                .updatedBy(user != null ? user.getFullName() : null)
                .emailUserUpdate(user != null ? user.getEmail() : null)
                .build();
    }


    private boolean isTerminalStatus(String status, Payment payment) {
        // Nếu là ReturnedToSeller, kiểm tra payment method
        if ("ReturnedToSeller".equalsIgnoreCase(status)) {
            if (payment != null && "ZALOPAY".equalsIgnoreCase(payment.getPaymentMethod()) && "SUCCESS".equalsIgnoreCase(payment.getPaymentStatus())) {
                // Cho phép chuyển tiếp sang Refunded
                return false;
            }
            // COD hoặc chưa thanh toán thì là kết thúc
            return true;
        }
        return List.of("Cancelled", "Completed", "Refunded").contains(status);
    }

    private Map<String, Set<String>> getAllowedTransitions() {
        Map<String, Set<String>> transitions = new HashMap<>();
        transitions.put("Pending", Set.of("Confirmed", "Cancelled"));
        transitions.put("WaitingForStock", Set.of("Cancelled"));
        transitions.put("Confirmed", Set.of("Shipping", "Cancelled"));
        transitions.put("Shipping", Set.of("Delivered", "DeliveryFailed"));
        transitions.put("DeliveryFailed", Set.of("ReturnedToSeller"));
        transitions.put("Delivered", Set.of("CustomerReceived", "ReturnRequested"));
        transitions.put("CustomerReceived", Set.of("Completed"));
        transitions.put("ReturnRequested", Set.of("ReturnApproved", "ReturnRejected"));
        transitions.put("ReturnApproved", Set.of("Refunded", "ReturnedToSeller"));
        transitions.put("ReturnRejected", Set.of("Completed"));
        transitions.put("ReturnedToSeller", Set.of("Refunded"));
        return transitions;
    }

    public Set<String> getAllowedTransitionsByStatus(String currentStatus) {
        return getAllowedTransitions().getOrDefault(currentStatus, Set.of());
    }

    private void restockOrderItems(Order order) {
        order.getOrderItems().forEach(item -> {
            var variant = item.getVariant();
            variant.setQuantityInStock(variant.getQuantityInStock() + item.getQuantity());
        });
    }

    private void refundIfNeeded(Order order, String reason) {
        Payment payment = paymentRepository.findByOrder(order);
        if (payment != null && "SUCCESS".equalsIgnoreCase(payment.getPaymentStatus())) {
            try {
                long amount = payment.getAmount().longValueExact();
                zaloPayService.refundTransaction(payment.getZpTransId(), amount, reason);
            } catch (Exception e) {
                log.error("Lỗi hoàn tiền: {}", e.getMessage(), e);
                throw new RuntimeException("Không thể hoàn tiền cho đơn hàng.", e);
            }
        }
    }

    public Set<String> getAllOrderStatuses() {
        Set<String> allStatuses = new HashSet<>();
        Map<String, Set<String>> transitions = getAllowedTransitions();
        allStatuses.addAll(transitions.keySet());
        transitions.values().forEach(allStatuses::addAll);
        return allStatuses;
    }

    private void updateCodPaymentStatus(Order order) {
        Payment payment = paymentRepository.findByOrder(order);
        if (payment != null
                && "COD".equalsIgnoreCase(payment.getPaymentMethod())
                && !"SUCCESS".equalsIgnoreCase(payment.getPaymentStatus())) {

            payment.setPaymentStatus("SUCCESS");
            paymentRepository.save(payment);
            log.info("Cập nhật thành công thanh toán COD cho đơn hàng: {}", order.getOrderId());
        }
    }

    // Thêm hàm public để controller gọi
    public Order getOrderById(Integer orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));
    }

    public Payment getPaymentByOrder(Order order) {
        return paymentRepository.findByOrder(order);
    }
}
