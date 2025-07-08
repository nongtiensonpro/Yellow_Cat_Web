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
import org.yellowcat.backend.product.payment.Payment;
import org.yellowcat.backend.product.payment.PaymentRepository;
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
//    private final EmailService emailService;
    private final ZaloPayService zaloPayService;

    private static final int RETURN_ALLOWED_DAYS = 3;

    /**
     * Cập nhật trạng thái đơn hàng và lưu lại timeline kèm ảnh nếu có
     */
    @Transactional
    public Map<String, Object> updateOrderStatus(Integer orderId, String newStatus, String note, List<String> imageUrls) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        var payment = paymentRepository.findByOrder(order);
        String paymentStatus = (payment != null) ? payment.getPaymentStatus() : "Pending";
        String currentStatus = order.getOrderStatus();

        // Kiểm tra nếu trùng trạng thái hiện tại
        if (currentStatus.equalsIgnoreCase(newStatus)) {
            throw new RuntimeException("Đơn hàng đã ở trạng thái này rồi.");
        }

        // Không cho phép chuyển trạng thái nếu đã ở trạng thái kết thúc
        if (isTerminalStatus(currentStatus)) {
            throw new RuntimeException("Không thể thay đổi trạng thái của đơn hàng đã kết thúc.");
        }

        // Kiểm tra trạng thái chuyển tiếp có hợp lệ không
        Map<String, Set<String>> allowedTransitions = getAllowedTransitions();
        Set<String> allowedNextStates = allowedTransitions.getOrDefault(currentStatus, Collections.emptySet());

        if (!allowedNextStates.contains(newStatus)) {
            String allowed = allowedNextStates.isEmpty() ? "không có trạng thái nào khác" : String.join(", ", allowedNextStates);
            throw new RuntimeException("Không thể chuyển từ '" + currentStatus + "' sang '" + newStatus + "'. Chỉ có thể chuyển sang: " + allowed + ".");
        }

        // Nếu yêu cầu hoàn hàng sau giao hàng, kiểm tra điều kiện hoàn hàng
        if ("Delivered".equalsIgnoreCase(currentStatus) && "ReturnRequested".equalsIgnoreCase(newStatus)) {
            Optional<OrderTimeline> delivered = orderTimelineRepository.findFirstByOrderIdAndToStatusOrderByChangedAtAsc(orderId, "Delivered");
            if (delivered.isEmpty() || delivered.get().getChangedAt().plusDays(RETURN_ALLOWED_DAYS).isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Không đủ điều kiện để hoàn hàng.");
            }
            if ("Pending".equals(paymentStatus)) {
                throw new RuntimeException("Đơn hàng chưa thanh toán. Vui lòng liên hệ cửa hàng để xử lý.");
            }
        }

        // Nếu hủy khi đang chờ xử lý thì hoàn kho và hoàn tiền nếu cần
        if ("Pending".equalsIgnoreCase(currentStatus) && "Cancelled".equalsIgnoreCase(newStatus)) {
            restockOrderItems(order);
            Payment payment1 = paymentRepository.findByOrder(order);
            if (payment1 != null && "SUCCESS".equalsIgnoreCase(payment1.getPaymentStatus())) {
                String zp = payment1.getZpTransId();
                BigDecimal amount = payment1.getAmount();

                try {
                    long amountToRefund = amount.longValueExact();
                    String decp = "Hoàn tiền hủy đơn ở trạng thái PENDING";
                    zaloPayService.refundTransaction(zp, amountToRefund, decp);
                } catch (Exception e) {
                    log.error("Lỗi hoàn tiền khi hủy đơn hàng PENDING", e);
                    throw new RuntimeException("Không thể hoàn tiền đơn hàng khi hủy", e);
                }
            }
        }


        // Trả lại kho và hoàn tiền khi hàng hoàn về
        if ("ReturnedToSeller".equalsIgnoreCase(newStatus)) {
            restockOrderItems(order);
        }

        // Nếu trạng thái mới là hủy đơn, kiểm tra hoàn tiền
        if ("Cancelled".equalsIgnoreCase(newStatus)) {
            Payment payment1 = paymentRepository.findByOrder(order);
            if (payment1 != null && "SUCCESS".equalsIgnoreCase(payment1.getPaymentStatus())) {
                String zp = payment1.getZpTransId();
                BigDecimal amount = payment1.getAmount();

                try {
                    long amountToRefund = amount.longValueExact();
                    String decp = "Hoàn tiền hủy đơn ở trạng thái PENDING";
                    zaloPayService.refundTransaction(zp, amountToRefund, decp);
                } catch (Exception e) {
                    log.error("Lỗi hoàn tiền khi hủy đơn hàng PENDING", e);
                    throw new RuntimeException("Không thể hoàn tiền đơn hàng khi hủy", e);
                }
            }
        }

        // Chỉ được chuyển sang Completed sau khi khách đã xác nhận nhận hàng
        if ("Completed".equalsIgnoreCase(newStatus) && !"CustomerReceived".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Chỉ có thể hoàn tất đơn hàng sau khi khách hàng xác nhận đã nhận hàng.");
        } else if ("Completed".equalsIgnoreCase(newStatus)) {
            // Cộng dồn số lượng đã bán
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

    /**
     * Khách hàng xác nhận đã nhận hàng
     */
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

    /**
     * Tự động chuyển trạng thái sang CustomerReceived sau 3 ngày nếu khách không phản hồi
     */
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

    /**
     * Lưu timeline trạng thái đơn hàng, kèm hình ảnh nếu có
     */
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

    /**
     * Lấy lịch sử timeline của đơn hàng
     */
    public List<OrderTimeline> getTimelineByOrderId(Integer orderId) {
        return orderTimelineRepository.findByOrderIdOrderByChangedAtAsc(orderId);
    }

    /**
     * Trạng thái kết thúc không cho chuyển tiếp nữa
     */
    private boolean isTerminalStatus(String status) {
        return List.of("Cancelled", "Completed", "Refunded", "ReturnedToSeller").contains(status);
    }

    /**
     * Định nghĩa các trạng thái hợp lệ có thể chuyển tiếp
     */
    private Map<String, Set<String>> getAllowedTransitions() {
        Map<String, Set<String>> transitions = new HashMap<>();
        transitions.put("Pending", Set.of("Confirmed", "Cancelled"));
        transitions.put("Confirmed", Set.of("Packing", "Cancelled"));
        transitions.put("Packing", Set.of("Shipping", "Cancelled"));
        transitions.put("Shipping", Set.of("Delivered", "DeliveryFailed"));
        transitions.put("DeliveryFailed", Set.of("ReturnedToSeller"));
        transitions.put("Delivered", Set.of("CustomerReceived", "ReturnRequested"));
        transitions.put("CustomerReceived", Set.of("Completed"));
        transitions.put("ReturnRequested", Set.of("ReturnApproved", "ReturnRejected"));
        transitions.put("ReturnApproved", Set.of("ReturnedToWarehouse"));
        transitions.put("ReturnedToWarehouse", Set.of("Refunded"));
        transitions.put("ReturnRejected", Set.of("CustomerReceived"));
        transitions.put("ReturnedToSeller", Set.of("Refunded"));
        return transitions;
    }

    /**
     * Lấy danh sách trạng thái có thể chuyển tiếp từ trạng thái hiện tại
     */
    public Set<String> getAllowedTransitionsByStatus(String currentStatus) {
        return getAllowedTransitions().getOrDefault(currentStatus, Set.of());
    }

    /**
     * Trả lại kho khi đơn hàng bị hủy hoặc trả hàng thành công
     */
    private void restockOrderItems(Order order) {
        order.getOrderItems().forEach(item -> {
            var variant = item.getVariant();
            variant.setQuantityInStock(variant.getQuantityInStock() + item.getQuantity());
        });
    }

    /**
     * Trả về toàn bộ trạng thái hệ thống đang hỗ trợ (bao gồm cả trạng thái đích)
     */
    public Set<String> getAllOrderStatuses() {
        Set<String> allStatuses = new HashSet<>();

        Map<String, Set<String>> transitions = getAllowedTransitions();

        allStatuses.addAll(transitions.keySet());
        for (Set<String> targets : transitions.values()) {
            allStatuses.addAll(targets);
        }

        return allStatuses;
    }

}
