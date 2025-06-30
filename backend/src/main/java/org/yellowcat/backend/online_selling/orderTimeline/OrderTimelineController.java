package org.yellowcat.backend.online_selling.orderTimeline;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/order-timelines")
@RequiredArgsConstructor
public class OrderTimelineController {
    private final OrderTimelineService orderTimelineService;

    // =============================== CHUNG ===============================

    // ALL: Lấy lịch sử trạng thái đơn hàng
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<List<OrderTimeline>>> getTimeline(@PathVariable Integer orderId) {
        List<OrderTimeline> timeline = orderTimelineService.getTimelineByOrderId(orderId);
        ApiResponse<List<OrderTimeline>> response = new ApiResponse<>(HttpStatus.OK,
                "Lấy lịch sử trạng thái đơn hàng thành công", timeline);
        return ResponseEntity.ok(response);
    }

    // =============================== KHÁCH HÀNG ===============================

    // CUSTOMER: Xác nhận đã nhận hàng
    @PostMapping("/confirm-received")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmCustomerReceived(@RequestBody Map<String, Object> body) {
        Integer orderId = (Integer) body.get("orderId");
        String note = (String) body.get("note");
        Map<String, Object> result = orderTimelineService.confirmCustomerReceived(orderId, note);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, (String) result.get("message"), result));
    }

    // CUSTOMER: Gửi yêu cầu hoàn hàng
    @PostMapping("/request-return")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestReturn(@RequestBody Map<String, Object> body) {
        Integer orderId = (Integer) body.get("orderId");
        String note = (String) body.get("note");
        return updateOrderStatus(orderId, "ReturnRequested", note);
    }

    // CUSTOMER: Báo không nhận được hàng
    @PostMapping("/not-received")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportNotReceived(@RequestBody Map<String, Object> body) {
        Integer orderId = (Integer) body.get("orderId");
        return updateOrderStatus(orderId, "NotReceivedReported", "Khách hàng báo không nhận được hàng");
    }

    // CUSTOMER: Hủy đơn khi đang chờ xác nhận
    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelOrder(@RequestBody Map<String, Object> body) {
        Integer orderId = (Integer) body.get("orderId");
        return updateOrderStatus(orderId, "Cancelled", "Khách hàng hủy đơn hàng");
    }

    // CUSTOMER: Khiếu nại nếu bị từ chối hoàn hàng
    @PostMapping("/dispute")
    public ResponseEntity<ApiResponse<Map<String, Object>>> disputeReturn(@RequestBody Map<String, Object> body) {
        Integer orderId = (Integer) body.get("orderId");
        String note = (String) body.get("note");
        return updateOrderStatus(orderId, "Dispute", note);
    }

    // =============================== NHÂN VIÊN / ADMIN ===============================

    @PostMapping("/confirm") // ADMIN: Xác nhận đơn hàng (Pending -> Confirmed)
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmOrder(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "Confirmed", (String) body.get("note"));
    }

    @PostMapping("/process") // ADMIN: Xử lý đơn hàng (Confirmed -> Processing)
    public ResponseEntity<ApiResponse<Map<String, Object>>> processOrder(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "Processing", (String) body.get("note"));
    }

    @PostMapping("/ship") // ADMIN: Giao hàng (Processing -> Shipping)
    public ResponseEntity<ApiResponse<Map<String, Object>>> shipOrder(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "Shipping", (String) body.get("note"));
    }

    @PostMapping("/deliver") // ADMIN: Giao hàng thành công (Shipping -> Delivered)
    public ResponseEntity<ApiResponse<Map<String, Object>>> deliverOrder(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "Delivered", (String) body.get("note"));
    }

    @PostMapping("/delivery-failed-1") // ADMIN: Giao lần 1 thất bại
    public ResponseEntity<ApiResponse<Map<String, Object>>> failedDelivery1(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "DeliveryFailed1", (String) body.get("note"));
    }

    @PostMapping("/delivery-failed-2") // ADMIN: Giao lần 2 thất bại
    public ResponseEntity<ApiResponse<Map<String, Object>>> failedDelivery2(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "DeliveryFailed2", (String) body.get("note"));
    }

    @PostMapping("/delivery-failed-3") // ADMIN: Giao lần 3 thất bại
    public ResponseEntity<ApiResponse<Map<String, Object>>> failedDelivery3(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "DeliveryFailed3", (String) body.get("note"));
    }

    @PostMapping("/returned-to-seller") // ADMIN: Trả lại người bán
    public ResponseEntity<ApiResponse<Map<String, Object>>> returnedToSeller(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "ReturnedToSeller", (String) body.get("note"));
    }

    @PostMapping("/report-incident") // ADMIN: Báo sự cố
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportIncident(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "IncidentReported", (String) body.get("note"));
    }

    @PostMapping("/investigate") // ADMIN: Điều tra sự cố
    public ResponseEntity<ApiResponse<Map<String, Object>>> investigate(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "Investigation", (String) body.get("note"));
    }

    @PostMapping("/redeliver") // ADMIN: Giao lại thành công
    public ResponseEntity<ApiResponse<Map<String, Object>>> redeliver(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "Delivered", (String) body.get("note"));
    }

    @PostMapping("/lost-or-damaged") // ADMIN: Thất lạc/hư hỏng
    public ResponseEntity<ApiResponse<Map<String, Object>>> lostOrDamaged(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "LostOrDamaged", (String) body.get("note"));
    }

    @PostMapping("/refund") // ADMIN: Hoàn tiền
    public ResponseEntity<ApiResponse<Map<String, Object>>> refundOrder(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "Refunded", (String) body.get("note"));
    }

    @PostMapping("/approve-return") // ADMIN: Duyệt hoàn hàng
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveReturn(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "ReturnApproved", (String) body.get("note"));
    }

    @PostMapping("/reject-return") // ADMIN: Từ chối hoàn hàng
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejectReturn(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "ReturnRejected", (String) body.get("note"));
    }

    @PostMapping("/final-reject") // ADMIN: Từ chối khiếu nại cuối cùng
    public ResponseEntity<ApiResponse<Map<String, Object>>> finalReject(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "CustomerReceived", (String) body.get("note"));
    }

    @PostMapping("/returning") // ADMIN: Đang hoàn trả
    public ResponseEntity<ApiResponse<Map<String, Object>>> returning(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "ReturningInProgress", (String) body.get("note"));
    }

    @PostMapping("/returned-to-warehouse") // ADMIN: Hàng đã trả về kho
    public ResponseEntity<ApiResponse<Map<String, Object>>> returnedToWarehouse(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "ReturnedToWarehouse", (String) body.get("note"));
    }

    @PostMapping("/refund-after-return") // ADMIN: Hoàn tiền sau khi trả về kho
    public ResponseEntity<ApiResponse<Map<String, Object>>> refundAfterReturn(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "Refunded", (String) body.get("note"));
    }

    @PostMapping("/complete") // ADMIN: Hoàn tất đơn hàng
    public ResponseEntity<ApiResponse<Map<String, Object>>> completeOrder(@RequestBody Map<String, Object> body) {
        return updateOrderStatus((Integer) body.get("orderId"), "Completed", (String) body.get("note"));
    }

    // =============================== HÀM CHUNG ===============================

    private ResponseEntity<ApiResponse<Map<String, Object>>> updateOrderStatus(Integer orderId, String newStatus, String note) {
        try {
            Map<String, Object> result = orderTimelineService.updateOrderStatus(orderId, newStatus, note);
            return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, (String) result.get("message"), result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(HttpStatus.BAD_REQUEST,
                    "Không thể cập nhật trạng thái đơn hàng", e.getMessage()));
        }
    }
}
