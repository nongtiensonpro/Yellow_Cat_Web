package org.yellowcat.backend.online_selling.orderTimeline;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.online_selling.image_of_order_timeline.ImageRepository;
import org.yellowcat.backend.online_selling.image_of_order_timeline.OrderTimelineImage;
import org.yellowcat.backend.online_selling.oder_online.OderOnlineRepository;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.payment.Payment;
import org.yellowcat.backend.product.payment.PaymentRepository;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.zalopay.ZaloPayService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderTimelineService {

    private final OrderTimelineRepository orderTimelineRepository;
    private final OderOnlineRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ImageRepository imageRepository;
    private final ZaloPayService zaloPayService;

    private static final int RETURN_ALLOWED_DAYS = 3;

    @Transactional
    public Map<String, Object> updateOrderStatus(Integer orderId, String newStatus, String note, List<String> imageUrls) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        var payment = paymentRepository.findByOrder(order);
        String paymentStatus = (payment != null) ? payment.getPaymentStatus() : "Pending";
        String currentStatus = order.getOrderStatus();

        if (currentStatus.equalsIgnoreCase(newStatus)) {
            throw new RuntimeException("Đơn hàng đã ở trạng thái này rồi.");
        }

        if (isTerminalStatus(currentStatus)) {
            throw new RuntimeException("Không thể thay đổi trạng thái của đơn hàng đã kết thúc.");
        }

        if ("Delivered".equalsIgnoreCase(currentStatus) && "ReturnRequested".equalsIgnoreCase(newStatus)) {
            Optional<OrderTimeline> delivered = orderTimelineRepository.findFirstByOrderIdAndToStatusOrderByChangedAtAsc(orderId, "Delivered");
            if (delivered.isEmpty() || delivered.get().getChangedAt().plusDays(RETURN_ALLOWED_DAYS).isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Không đủ điều kiện để hoàn hàng.");
            }
            if ("Pending".equals(paymentStatus)) {
                throw new RuntimeException("Đơn hàng chưa thanh toán. Vui lòng liên hệ cửa hàng để xử lý.");
            }
        }

        if ("Pending".equalsIgnoreCase(currentStatus) && "Cancelled".equalsIgnoreCase(newStatus)) {
            restockOrderItems(order);
            refundIfNeeded(order, "Hoàn tiền hủy đơn ở trạng thái PENDING");
        }

        if ("ReturnedToSeller".equalsIgnoreCase(newStatus)) {
            restockOrderItems(order);
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
        saveTimeline(orderId, currentStatus, newStatus, finalNote, imageUrls);

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
                order.setOrderStatus("Confirmed");
                orderRepository.save(order);
                saveTimeline(order.getOrderId(), previousStatus, "Confirmed", "Đủ hàng và tự động chuyển sang xác nhận.", null);
            }
        }
    }

    @Transactional
    public Map<String, Object> confirmCustomerReceived(Integer orderId, String note) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng."));

        if (!"Delivered".equalsIgnoreCase(order.getOrderStatus())) {
            throw new RuntimeException("Chỉ có thể xác nhận nhận hàng sau khi đã giao.");
        }

        order.setOrderStatus("CustomerReceived");
        orderRepository.save(order);

        String finalNote = (note == null || note.trim().isEmpty()) ? "Khách hàng xác nhận đã nhận hàng." : note;
        saveTimeline(orderId, "Delivered", "CustomerReceived", finalNote, null);

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
                saveTimeline(orderId, "Delivered", "CustomerReceived", "Tự động xác nhận sau 3 ngày kể từ khi nhận hàng", null);
            }
        }
    }

    public void saveTimeline(Integer orderId, String fromStatus, String toStatus, String note, List<String> imageUrls) {
        OrderTimeline timeline = new OrderTimeline(orderId, fromStatus, toStatus, note, LocalDateTime.now());
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

    public List<OrderTimeline> getTimelineByOrderId(Integer orderId) {
        return orderTimelineRepository.findByOrderIdOrderByChangedAtAsc(orderId);
    }

    private boolean isTerminalStatus(String status) {
        return List.of("Cancelled", "Completed", "Refunded", "ReturnedToSeller").contains(status);
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
        transitions.put("ReturnApproved", Set.of("Refunded"));
        transitions.put("ReturnRejected", Set.of("CustomerReceived"));
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
}
