package org.yellowcat.backend.product.order;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.order.dto.OrderResponse;
import org.yellowcat.backend.product.order.dto.OrderUpdateRequest;
import org.yellowcat.backend.product.order.dto.OrderUpdateResponse;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderController {
    OrderService orderService;

    @GetMapping()
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<OrderResponse> orders = orderService.getOrders(page, size);
        PageResponse<OrderResponse> pageResponse = new PageResponse<>(orders);

        return ResponseEntityBuilder.success(pageResponse);
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> getOrderByStatus(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam String status
    ) {
        Page<OrderResponse> orders = orderService.getOrderByStatus(page, size, status);
        PageResponse<OrderResponse> pageResponse = new PageResponse<>(orders);

        return ResponseEntityBuilder.success(pageResponse);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> createOrder() {
        Order order = orderService.createOrder();
        return ResponseEntityBuilder.success(order);
    }

    @PutMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> updateOrder(@RequestBody OrderUpdateRequest request) {
        OrderUpdateResponse order = orderService.updateOrder(request);
        return ResponseEntityBuilder.success(order);
    }

    @DeleteMapping("/{orderId}")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> deleteOrder(@PathVariable Integer orderId) {
        try {
            orderService.deleteOrder(orderId);
            return ResponseEntityBuilder.success("Order deleted successfully");
        } catch (Exception e) {
            System.err.println("Error deleting order: " + e.getMessage());
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "Failed to delete order: ", e.getMessage());
        }
    }

    // Tự động xác nhận thanh toán thành công khi gọi từ VNPAY
    @GetMapping("/orderCode/{orderCode:.+}")
    @PreAuthorize("hasAnyAuthority('Admin_Web','Staff_Web')")
    public ResponseEntity<?> getOrderByOrderCodeAutomaticPaymenWhenCalling(@PathVariable String orderCode) {
        OrderResponse order = orderService.findOrderByOrderCode(orderCode);
        System.out.println("Received order: " + order.toString());
        return ResponseEntityBuilder.success(order);
    }
    
    // Endpoint để VNPAY callback tự động xác nhận thanh toán
    @PostMapping("/vnpay-confirm/{orderCode}")
    @PreAuthorize("hasAnyAuthority('Admin_Web','Staff_Web')")
    public ResponseEntity<?> confirmVNPayPayment(
            @PathVariable String orderCode,
            @RequestParam String transactionId) {
        try {

            
            OrderUpdateResponse updatedOrder = orderService.confirmVNPayPayment(orderCode, transactionId);

            return ResponseEntityBuilder.success(updatedOrder);
        } catch (Exception e) {

            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST,"Failed to confirm payment: " , e.getMessage());
        }
    }

    // Endpoint GET để VNPAY callback (một số hệ thống dùng GET)
    @GetMapping("/vnpay-confirm/{orderCode}")
    @PreAuthorize("hasAnyAuthority('Admin_Web','Staff_Web')")
    public ResponseEntity<?> confirmVNPayPaymentGet(
            @PathVariable String orderCode,
            @RequestParam String transactionId) {
        System.out.println("=== GET /api/orders/vnpay-confirm/" + orderCode + " called ===");
        try {


            OrderUpdateResponse updatedOrder = orderService.confirmVNPayPayment(orderCode, transactionId);

            return ResponseEntityBuilder.success(updatedOrder);
        } catch (Exception e) {
            System.err.println("Error confirming VNPay payment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST,"Failed to confirm payment: " , e.getMessage());
        }
    }

    // Endpoint riêng để CHECK STATUS đơn hàng (không confirm payment) - dùng cho polling từ frontend
    @GetMapping("/status/{orderCode}")
    @PreAuthorize("hasAnyAuthority('Admin_Web','Staff_Web')")
    public ResponseEntity<?> getOrderStatusByOrderCode(@PathVariable String orderCode) {
        System.out.println("=== GET /api/orders/status/" + orderCode + " called ===");
        try {

            //Sử dụng method mới để lấy Order với payments
            OrderUpdateResponse order = orderService.findOrderWithPaymentsByOrderCode(orderCode);
            
            if (order == null) {

                return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Order not found with orderCode: " , orderCode);
            }
            return ResponseEntityBuilder.success(order);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get order status: ", e.getMessage());
        }
    }
}