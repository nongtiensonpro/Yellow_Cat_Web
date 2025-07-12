package org.yellowcat.backend.online_selling.orderTimeline;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.online_selling.orderTimeline.dto.UpdateStatusRequest;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/order-timelines")
@RequiredArgsConstructor
public class OrderTimelineController {
    private final OrderTimelineService orderTimelineService;

    // ========================== CHUNG ==========================

    /**
     * API lấy toàn bộ lịch sử thay đổi trạng thái của một đơn hàng
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<List<OrderTimeline>>> getTimeline(@PathVariable Integer orderId) {
        List<OrderTimeline> timeline = orderTimelineService.getTimelineByOrderId(orderId);
        ApiResponse<List<OrderTimeline>> response = new ApiResponse<>(HttpStatus.OK,
                "Lấy lịch sử trạng thái đơn hàng thành công", timeline);
        return ResponseEntity.ok(response);
    }

    /**
     * API lấy danh sách các trạng thái hợp lệ có thể chuyển tiếp từ trạng thái hiện tại
     */
    @GetMapping("/transitions/{currentStatus}")
    public ResponseEntity<ApiResponse<Set<String>>> getAllowedTransitions(@PathVariable String currentStatus) {
        Set<String> allowed = orderTimelineService.getAllowedTransitionsByStatus(currentStatus);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Danh sách trạng thái tiếp theo hợp lệ", allowed));
    }

    // ========================== KHÁCH HÀNG ==========================

    /**
     * KHÁCH HÀNG: Xác nhận đã nhận hàng (từ trạng thái Delivered → CustomerReceived)
     */
    @PostMapping("/confirm-received")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmCustomerReceived(@RequestBody UpdateStatusRequest request) {
        try {
            Map<String, Object> result = orderTimelineService.confirmCustomerReceived(
                    request.getOrderId(), request.getNote()
            );
            return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, (String) result.get("message"), result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(HttpStatus.BAD_REQUEST,
                    "Không thể xác nhận đã nhận hàng", e.getMessage()));
        }
    }

    /**
     * KHÁCH HÀNG: Yêu cầu hoàn hàng sau khi đã nhận (Delivered → ReturnRequested)
     */
    @PostMapping("/request-return")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestReturn(@RequestBody UpdateStatusRequest request) {
        return updateOrderStatus(request.getOrderId(), "ReturnRequested", request.getNote(), request.getImageUrls());
    }

    /**
     * KHÁCH HÀNG: Báo cáo không nhận được hàng (Delivered → NotReceivedReported)
     */
    @PostMapping("/not-received")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportNotReceived(@RequestBody UpdateStatusRequest request) {
        return updateOrderStatus(request.getOrderId(), "NotReceivedReported", "Khách hàng báo không nhận được hàng", request.getImageUrls());
    }

    /**
     * KHÁCH HÀNG: Hủy đơn hàng (Pending | Confirmed | Processing → Cancelled)
     */
    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelOrder(@RequestBody UpdateStatusRequest request) {
        return updateOrderStatus(request.getOrderId(), "Cancelled", "Khách hàng hủy đơn hàng", request.getImageUrls());
    }

    /**
     * KHÁCH HÀNG: Khiếu nại sau khi bị từ chối hoàn hàng (ReturnRejected → Dispute)
     */
    @PostMapping("/dispute")
    public ResponseEntity<ApiResponse<Map<String, Object>>> disputeReturn(@RequestBody UpdateStatusRequest request) {
        return updateOrderStatus(request.getOrderId(), "Dispute", request.getNote(), request.getImageUrls());
    }

    /**
     * KHÁCH HÀNG: Phản hồi về đơn hàng hư hỏng/thất lạc nhưng chưa thanh toán
     * Chọn: huỷ đơn hàng hoặc đồng ý đặt lại đơn mới (về trạng thái Pending)
     */
    @PostMapping("/customer-decision")
    public ResponseEntity<ApiResponse<Map<String, Object>>> customerDecisionForLostOrDamaged(@RequestBody UpdateStatusRequest request) {
        if (!Set.of("Cancelled", "Pending").contains(request.getNewStatus())) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(HttpStatus.BAD_REQUEST,
                    "Chỉ được chọn Cancelled hoặc Pending cho trạng thái CustomerDecisionPending", null));
        }
        return updateOrderStatus(request.getOrderId(), request.getNewStatus(), request.getNote(), request.getImageUrls());
    }

    // ========================== ADMIN ==========================

    /**
     * ADMIN: Cập nhật trạng thái đơn hàng bất kỳ (có kiểm tra luồng hợp lệ)
     */
    @PostMapping("/admin/update")
    public ResponseEntity<ApiResponse<Map<String, Object>>> adminUpdateStatus(@RequestBody UpdateStatusRequest request) {
        return updateOrderStatus(request.getOrderId(), request.getNewStatus(), request.getNote(), request.getImageUrls());
    }

    // ========================== HÀM CHUNG ==========================

    /**
     * Hàm xử lý chung cập nhật trạng thái đơn hàng
     */
    private ResponseEntity<ApiResponse<Map<String, Object>>> updateOrderStatus(Integer orderId, String newStatus, String note, List<String> imageUrls) {
        try {
            Map<String, Object> result = orderTimelineService.updateOrderStatus(orderId, newStatus, note, imageUrls);
            return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, (String) result.get("message"), result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(HttpStatus.BAD_REQUEST,
                    "Không thể cập nhật trạng thái đơn hàng", e.getMessage()));
        }
    }

    // Hàm lấy tất cả các trạng thái
    @GetMapping("/status-list")
    public ResponseEntity<?> getAllOrderStatuses() {
        Set<String> statuses = orderTimelineService.getAllOrderStatuses();
        return ResponseEntity.ok(statuses);
    }

    /**
     * Gọi API test xử lý đơn hàng chờ nếu sản phẩm đủ tồn kho
     */
    @PostMapping("/check-waiting-orders")
    public ResponseEntity<?> checkWaitingOrders(@RequestBody Map<String, List<Integer>> body) {
        List<Integer> variantIds = body.get("variantIds");
        if (variantIds == null || variantIds.isEmpty()) {
            return ResponseEntity.badRequest().body("Thiếu variantIds trong request body");
        }

        orderTimelineService.checkWaitingOrdersAndUpdateStockForVariants(variantIds);
        return ResponseEntity.ok("Đã kiểm tra và xử lý các đơn hàng chờ nếu đủ tồn kho.");
    }
}