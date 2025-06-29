package org.yellowcat.backend.online_selling.orderTimeline;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.online_selling.oder_online.OderOnlineRepository;
import org.yellowcat.backend.product.order.Order;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderTimelineService {

    private final OrderTimelineRepository orderTimelineRepository;
    private final OderOnlineRepository orderRepository;

    // Số ngày cho phép khách hàng được yêu cầu hoàn hàng sau khi giao
    private static final int RETURN_ALLOWED_DAYS = 3;

    /**
     * ADMIN/CUSTOMER: Cập nhật trạng thái đơn hàng (có kiểm tra điều kiện chuyển đổi)
     */
    @Transactional
    public Map<String, Object> updateOrderStatus(Integer orderId, String newStatus, String note) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId));

        String currentStatus = order.getOrderStatus();

        // Trạng thái mới giống trạng thái cũ
        if (currentStatus.equalsIgnoreCase(newStatus)) {
            throw new RuntimeException("Đơn hàng đã ở trạng thái này rồi.");
        }

        // Không cho phép cập nhật nếu đơn đã kết thúc
        if (isTerminalStatus(currentStatus)) {
            throw new RuntimeException("Không thể thay đổi trạng thái của đơn hàng đã ở trạng thái kết thúc.");
        }

        // Kiểm tra trạng thái mới có nằm trong các trạng thái cho phép chuyển tiếp không
        Map<String, Set<String>> allowedTransitions = getAllowedTransitions();
        Set<String> allowedNextStates = allowedTransitions.getOrDefault(currentStatus, Collections.emptySet());

        if (!allowedNextStates.contains(newStatus)) {
            String allowed = allowedNextStates.isEmpty()
                    ? "không có trạng thái nào khác"
                    : String.join(", ", allowedNextStates);
            throw new RuntimeException("Không thể chuyển từ '" + currentStatus + "' sang '" + newStatus + "'. "
                    + "Chỉ có thể chuyển sang: " + allowed + ".");
        }

        // Nếu khách yêu cầu hoàn hàng
        if ("Delivered".equalsIgnoreCase(currentStatus) && "ReturnRequested".equalsIgnoreCase(newStatus)) {
            Optional<OrderTimeline> delivered = orderTimelineRepository
                    .findFirstByOrderIdAndToStatusOrderByChangedAtAsc(orderId, "Delivered");

            if (delivered.isEmpty()) {
                throw new RuntimeException("Không tìm thấy thời điểm giao hàng để kiểm tra điều kiện hoàn hàng.");
            }

            if (delivered.get().getChangedAt().plusDays(RETURN_ALLOWED_DAYS).isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Đã quá thời gian cho phép hoàn hàng.");
            }

            if (!order.isPaid()) {
                log.warn("Khách hàng yêu cầu hoàn hàng nhưng đơn hàng chưa thanh toán: {}", orderId);
                throw new RuntimeException("Đơn hàng chưa thanh toán. Vui lòng liên hệ cửa hàng để xử lý.");
            }
        }

        // Nếu đơn bị huỷ từ trạng thái Pending thì hoàn lại kho
        if ("Pending".equalsIgnoreCase(currentStatus) && "Cancelled".equalsIgnoreCase(newStatus)) {
            restockOrderItems(order);
        }

        // Nếu xác nhận hoàn tất đơn thì cộng vào thống kê sản phẩm đã bán
        if ("Completed".equalsIgnoreCase(newStatus)) {
            if (!"CustomerReceived".equalsIgnoreCase(currentStatus)) {
                throw new RuntimeException("Chỉ có thể hoàn tất đơn hàng sau khi khách hàng xác nhận đã nhận hàng.");
            }
            order.getOrderItems().forEach(item -> {
                var variant = item.getVariant();
                Integer currentSold = variant.getSold() != null ? variant.getSold() : 0;
                variant.setSold(currentSold + item.getQuantity());
            });
        }

        // Nếu đơn trả về kho (trả hàng thành công) → hoàn kho
        if ("ReturnedToWarehouse".equalsIgnoreCase(newStatus)) {
            restockOrderItems(order);
        }

        // Nếu đơn hàng hư hỏng/thất lạc thì cần kiểm tra đã thanh toán chưa
        if ("LostOrDamaged".equalsIgnoreCase(newStatus)) {
            if (!order.isPaid()) {
                throw new RuntimeException("Chỉ đơn hàng đã thanh toán mới có thể hoàn tiền do thất lạc/hư hỏng.");
            }
        }

        // Cập nhật trạng thái đơn hàng
        order.setOrderStatus(newStatus);
        orderRepository.save(order);

        // Ghi chú mặc định nếu không có note từ phía client
        String finalNote = (note == null || note.trim().isEmpty()) ? "Không có ghi chú." : note;
        saveTimeline(orderId, currentStatus, newStatus, finalNote);

        // Trả kết quả
        Map<String, Object> response = new HashMap<>();
        response.put("orderId", orderId);
        response.put("fromStatus", currentStatus);
        response.put("toStatus", newStatus);
        response.put("message", "Chuyển trạng thái đơn hàng thành công từ '" + currentStatus + "' sang '" + newStatus + "'.");
        return response;
    }

    /**
     * CUSTOMER: Khách hàng xác nhận đã nhận hàng
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
        saveTimeline(orderId, "Delivered", "CustomerReceived", finalNote);

        Map<String, Object> res = new HashMap<>();
        res.put("orderId", orderId);
        res.put("fromStatus", "Delivered");
        res.put("toStatus", "CustomerReceived");
        res.put("message", "Khách hàng xác nhận đã nhận hàng.");
        return res;
    }

    /**
     * SYSTEM: Tự động cập nhật trạng thái "CustomerReceived" sau 3 ngày giao hàng nếu chưa xác nhận
     */
    @Scheduled(cron = "0 0 12 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void autoMarkCustomerReceived() {
        LocalDateTime deadline = LocalDateTime.now().minusDays(3);
        List<OrderTimeline> deliveredTimelines = orderTimelineRepository
                .findByToStatusAndChangedAtBefore("Delivered", deadline);

        log.info("Đang kiểm tra {} đơn hàng đã giao trước {}", deliveredTimelines.size(), deadline);

        for (OrderTimeline timeline : deliveredTimelines) {
            Integer orderId = timeline.getOrderId();
            Order order = orderRepository.findById(orderId).orElse(null);

            if (order != null && "Delivered".equalsIgnoreCase(order.getOrderStatus())) {
                order.setOrderStatus("CustomerReceived");
                orderRepository.save(order);

                saveTimeline(order.getOrderId(), "Delivered", "CustomerReceived", "Tự động xác nhận sau 3 ngày kể từ khi nhận hàng");

                log.info("Đơn hàng {} đã được cập nhật sang 'CustomerReceived'", orderId);
            } else {
                log.warn("Không thể cập nhật đơn hàng {}. Trạng thái hiện tại: {}", orderId,
                        order != null ? order.getOrderStatus() : "null");
            }
        }
    }

    /**
     * Ghi lại lịch sử timeline chuyển trạng thái đơn hàng
     */
    public void saveTimeline(Integer orderId, String fromStatus, String toStatus, String note) {
        OrderTimeline timeline = new OrderTimeline(orderId, fromStatus, toStatus, note, LocalDateTime.now());
        orderTimelineRepository.save(timeline);
    }

    /**
     * Lấy toàn bộ lịch sử trạng thái theo ID đơn hàng
     */
    public List<OrderTimeline> getTimelineByOrderId(Integer orderId) {
        return orderTimelineRepository.findByOrderIdOrderByChangedAtAsc(orderId);
    }

    /**
     * Kiểm tra trạng thái có phải là trạng thái kết thúc không
     */
    private boolean isTerminalStatus(String status) {
        return List.of("Cancelled", "Completed", "Refunded", "ReturnedToSeller", "FinalRejected").contains(status);
    }

    /**
     * Danh sách các trạng thái hợp lệ tiếp theo cho từng trạng thái hiện tại
     */
    private Map<String, Set<String>> getAllowedTransitions() {
        Map<String, Set<String>> transitions = new HashMap<>();

        transitions.put("Pending", Set.of("Confirmed", "Cancelled"));
        transitions.put("Confirmed", Set.of("Processing", "Cancelled"));
        transitions.put("Processing", Set.of("Shipping", "Cancelled"));
        transitions.put("Shipping", Set.of("Delivered", "DeliveryFailed1", "IncidentReported"));

        transitions.put("IncidentReported", Set.of("Investigation"));
        transitions.put("Investigation", Set.of("LostOrDamaged", "Delivered"));
        transitions.put("LostOrDamaged", Set.of("Refunded"));

        transitions.put("Delivered", Set.of("ReturnRequested", "CustomerReceived", "NotReceivedReported"));
        transitions.put("NotReceivedReported", Set.of("Investigation"));
        transitions.put("CustomerReceived", Set.of("Completed"));

        transitions.put("ReturnRequested", Set.of("ReturnApproved", "ReturnRejected"));
        transitions.put("ReturnRejected", Set.of("Dispute"));
        transitions.put("Dispute", Set.of("ReturnApproved", "FinalRejected"));
        transitions.put("FinalRejected", Set.of("CustomerReceived"));

        transitions.put("ReturnApproved", Set.of("ReturningInProgress"));
        transitions.put("ReturningInProgress", Set.of("ReturnedToWarehouse"));
        transitions.put("ReturnedToWarehouse", Set.of("Refunded"));

        transitions.put("DeliveryFailed1", Set.of("DeliveryFailed2"));
        transitions.put("DeliveryFailed2", Set.of("DeliveryFailed3"));
        transitions.put("DeliveryFailed3", Set.of("ReturnedToSeller"));

        return transitions;
    }

    /**
     * Cộng lại số lượng sản phẩm vào kho khi đơn hàng bị huỷ hoặc trả hàng thành công
     */
    private void restockOrderItems(Order order) {
        order.getOrderItems().forEach(item -> {
            var variant = item.getVariant();
            variant.setQuantityInStock(variant.getQuantityInStock() + item.getQuantity());
        });
    }
}
