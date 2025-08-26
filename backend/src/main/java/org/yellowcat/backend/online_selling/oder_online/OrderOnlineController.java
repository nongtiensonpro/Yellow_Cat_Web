package org.yellowcat.backend.online_selling.oder_online;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.online_selling.oder_online.dto.OrderOnlineDetailDTO;
import org.yellowcat.backend.online_selling.oder_online.dto.OrderOnlineRequestDTO;
import org.yellowcat.backend.online_selling.oder_online.dto.OrderSummaryDTO;
import org.yellowcat.backend.product.order.Order;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderOnlineController {
    @Autowired
    OrderOnlineService orderOnlineService;

    @PostMapping("/online")
    public ResponseEntity<?> createOnlineOrder(@RequestBody OrderOnlineRequestDTO requestDTO) {
        try {
            Order order = orderOnlineService.createOrderFromOnlineRequest(requestDTO);
            String message = "Đơn hàng " + order.getOrderCode() + " đang chờ xét duyệt.";

            return ResponseEntityBuilder.success(message, null);
        } catch (RuntimeException e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "Tạo đơn hàng thất bại", e.getMessage());
        }
    }

    @PostMapping("/cancel/{orderId}")
    public ResponseEntity<?> cancelOrder(@PathVariable Integer orderId) {
        try {
            Order order = orderOnlineService.cancelOrder(orderId);
            return ResponseEntity.ok("Huỷ đơn hàng thành công: " + order.getOrderCode());
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/online")
    public ResponseEntity<?> getAllOnlineOrdersWithShipping() {
        try {
            var orders = orderOnlineService.getAllOnlineOrdersWithShipping();
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách đơn hàng", "error", e.getMessage()));
        }
    }

    @GetMapping("/online/status/{status}")
    public ResponseEntity<?> getOrdersByStatus(@PathVariable("status") String status) {
        try {
            List<OrderSummaryDTO> orders = orderOnlineService.getOnlineOrdersByStatus(status);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách đơn hàng", "error", e.getMessage()));
        }
    }

    @GetMapping("/by-status-group")
    public ResponseEntity<?> getOrdersByStatusGroup(@RequestParam String group) {
        try {
            List<OrderSummaryDTO> orders = orderOnlineService.getOrdersByStatusGroup(group);
            return ResponseEntity.ok(orders);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/detail-online/{orderId}")
    public ResponseEntity<?> getOrderDetail(@PathVariable Integer orderId) {
        try {
            OrderOnlineDetailDTO detail = orderOnlineService.getOrderDetail(orderId);
            return ResponseEntity.ok(detail);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user-orders")
    public ResponseEntity<List<OrderSummaryDTO>> getOrdersByUser(@RequestParam UUID keycloakId) {
        List<OrderSummaryDTO> orders = orderOnlineService.getOrdersByUser(keycloakId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/user-orders_pending")
    public ResponseEntity<List<OrderSummaryDTO>> getOrdersUserAndPending(@RequestParam UUID keycloakId) {
        String status = "Pending";
        List<OrderSummaryDTO> orders = orderOnlineService.getOrderStatus(keycloakId,status);
        return ResponseEntity.ok(orders);
    }
    @GetMapping("/user-orders_shipping")
    public ResponseEntity<List<OrderSummaryDTO>> getOrdersByUserAndShipping(@RequestParam UUID keycloakId) {
        String status = "Shipping";
        List<OrderSummaryDTO> orders = orderOnlineService.getOrderStatus(keycloakId,status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/user-orders_confirmed")
    public ResponseEntity<List<OrderSummaryDTO>> getOrdersByUserAndConfirmed(@RequestParam UUID keycloakId) {
        String status = "Confirmed";
        List<OrderSummaryDTO> orders = orderOnlineService.getOrderStatus(keycloakId,status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/user-orders_cancelled")
    public ResponseEntity<List<OrderSummaryDTO>> getOrdersByUserAndCancelled(@RequestParam UUID keycloakId) {
        String status = "Cancelled";
        List<OrderSummaryDTO> orders = orderOnlineService.getOrderStatus(keycloakId,status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/user-orders_delivered")
    public ResponseEntity<List<OrderSummaryDTO>> getOrdersByUserAndDelivered(@RequestParam UUID keycloakId) {
        String status = "Delivered";
        List<OrderSummaryDTO> orders = orderOnlineService.getOrderStatus(keycloakId,status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/user-orders_refunded")
    public ResponseEntity<List<OrderSummaryDTO>> getOrdersByUserAndRefunded(@RequestParam UUID keycloakId) {
        String status = "Refunded";
        List<OrderSummaryDTO> orders = orderOnlineService.getOrderStatus(keycloakId,status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/user-orders_completed")
    public ResponseEntity<List<OrderSummaryDTO>> getOrdersByUserAndCompleted(@RequestParam UUID keycloakId) {
        String status = "Completed";
        List<OrderSummaryDTO> orders = orderOnlineService.getOrderStatus(keycloakId,status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/user-orders_deliveryFailed")
    public ResponseEntity<List<OrderSummaryDTO>> getOrdersByUserAndDeliveryFailed(@RequestParam UUID keycloakId) {
        String status = "DeliveryFailed";
        List<OrderSummaryDTO> orders = orderOnlineService.getOrderStatus(keycloakId,status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/user-orders_returnedToSeller")
    public ResponseEntity<List<OrderSummaryDTO>> getOrdersByUserAndReturnedToSeller(@RequestParam UUID keycloakId) {
        String status = "ReturnedToSeller";
        List<OrderSummaryDTO> orders = orderOnlineService.getOrderStatus(keycloakId,status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/user-orders_returnRequested")
    public ResponseEntity<List<OrderSummaryDTO>> getOrdersByUserAndReturnRequested(@RequestParam UUID keycloakId) {
        String status = "ReturnRequested";
        List<OrderSummaryDTO> orders = orderOnlineService.getOrderStatus(keycloakId,status);
        return ResponseEntity.ok(orders);
    }

}
