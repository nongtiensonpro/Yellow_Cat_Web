package org.yellowcat.backend.shoppingOnline;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.shoppingOnline.dto.OrderOnlineRequestDTO;

import java.util.Map;

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
            return ResponseEntityBuilder.success(message, order);
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

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<?> changeOrderStatus(
            @PathVariable Integer orderId,
            @RequestParam("newStatus") String newStatus) {
        try {
            Order updatedOrder = orderOnlineService.updateOrderStatus(orderId, newStatus);
            return ResponseEntityBuilder.success("Cập nhật trạng thái đơn hàng thành công", updatedOrder);
        } catch (RuntimeException e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, e.getMessage(), null);
        }
    }

}
