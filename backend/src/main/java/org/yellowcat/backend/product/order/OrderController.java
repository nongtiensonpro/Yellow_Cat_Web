package org.yellowcat.backend.product.order;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.common.security.keycloak.UserDTO;
import org.yellowcat.backend.product.order.dto.OrderDetailResponse;
import org.yellowcat.backend.product.order.dto.OrderDetailWithItemsResponse;
import org.yellowcat.backend.product.order.dto.OrderResponse;
import org.yellowcat.backend.product.order.dto.OrderUpdateRequest;
import org.yellowcat.backend.product.order.dto.OrderUpdateResponse;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserService;

import java.util.List;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderController {
    OrderService orderService;
    AppUserService appUserService;

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
        System.out.println("=== GET /api/orders" + request.getOrderId() + " called ===");
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
            @RequestParam String transactionId,
            @AuthenticationPrincipal Jwt jwt) {
        System.out.println("=== GET /api/orders/vnpay-confirm/" + orderCode + " called ===");
        try {
            OrderUpdateResponse updatedOrder = orderService.confirmVNPayPayment(orderCode, transactionId);
            String userId = jwt.getSubject();
            System.out.println("User ID: " + userId);
            orderService.updateUserIDOrder(orderCode, UUID.fromString(userId));
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

    // Endpoint để checkin thanh toán bằng tiền mặt tại quầy
    @PostMapping("/cash-checkin/{orderCode}")
    @PreAuthorize("hasAnyAuthority('Admin_Web','Staff_Web')")
    public ResponseEntity<?> checkinCashPayment(@PathVariable String orderCode,
                                                @AuthenticationPrincipal Jwt jwt) {
        System.out.println("=== POST /api/orders/cash-checkin/" + orderCode + " called ===");
        try {
            String userId = jwt.getSubject();
            System.out.println("User ID: " + userId);
            OrderUpdateResponse updatedOrder = orderService.checkinCashPayment(orderCode);
            orderService.updateUserIDOrder(orderCode, UUID.fromString(userId));
            if (updatedOrder == null) {
                return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Order not found with orderCode: ", orderCode);
            }
            
            return ResponseEntityBuilder.success(updatedOrder);
        } catch (Exception e) {
            System.err.println("Error checking in cash payment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "Failed to checkin cash payment: ", e.getMessage());
        }
    }

    // Endpoint để tìm kiếm đơn hàng theo số điện thoại
    @GetMapping("/search/phone")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> getOrdersByPhoneNumber(@RequestParam String phoneNumber) {
        System.out.println("=== GET /api/orders/search/phone called with phoneNumber: " + phoneNumber + " ===");
        try {
            List<OrderDetailResponse> orders = orderService.findOrdersByPhoneNumber(phoneNumber);
            
            if (orders.isEmpty()) {
                return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng nào với số điện thoại: ", phoneNumber);
            }
            
            return ResponseEntityBuilder.success(orders);
        } catch (Exception e) {
            System.err.println("Error searching orders by phone number: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi tìm kiếm đơn hàng: ", e.getMessage());
        }
    }

    // Endpoint để tìm kiếm đơn hàng theo email
    @GetMapping("/search/email")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> getOrdersByEmail(@RequestParam String email) {
        System.out.println("=== GET /api/orders/search/email called with email: " + email + " ===");
        try {
            List<OrderDetailResponse> orders = orderService.findOrdersByEmail(email);
            
            if (orders.isEmpty()) {
                return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng nào với email: ", email);
            }
            
            return ResponseEntityBuilder.success(orders);
        } catch (Exception e) {
            System.err.println("Error searching orders by email: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi tìm kiếm đơn hàng: ", e.getMessage());
        }
    }

    // Endpoint để tìm kiếm đơn hàng theo số điện thoại hoặc email (linh hoạt)
    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> getOrdersByPhoneNumberOrEmail(@RequestParam String searchValue) {
        System.out.println("=== GET /api/orders/search called with searchValue: " + searchValue + " ===");
        try {
            List<OrderDetailResponse> orders = orderService.findOrdersByPhoneNumberOrEmail(searchValue);
            
            if (orders.isEmpty()) {
                return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng nào với thông tin: ", searchValue);
            }
            
            return ResponseEntityBuilder.success(orders);
        } catch (Exception e) {
            System.err.println("Error searching orders by phone number or email: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi tìm kiếm đơn hàng: ", e.getMessage());
        }
    }

    // Endpoint để lấy chi tiết đơn hàng kèm order items theo mã đơn hàng
    @GetMapping("/detail/{orderCode}")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> getOrderDetailWithItems(@PathVariable String orderCode) {
        System.out.println("=== GET /api/orders/detail/" + orderCode + " called ===");
        try {
            OrderDetailWithItemsResponse orderDetail = orderService.getOrderDetailByCode(orderCode);
            
            if (orderDetail == null) {
                return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng với mã: ", orderCode);
            }
            
            return ResponseEntityBuilder.success(orderDetail);
        } catch (Exception e) {
            System.err.println("Error getting order detail with items: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy chi tiết đơn hàng: ", e.getMessage());
        }
    }

    // Endpoint public để user có thể xem chi tiết đơn hàng của chính họ (không cần quyền Admin/Staff)
    @GetMapping("/public/detail/{orderCode}")
    public ResponseEntity<?> getOrderDetailPublic(@PathVariable String orderCode,
                                                 @AuthenticationPrincipal Jwt jwt) {
        System.out.println("=== GET /api/orders/public/detail/" + orderCode + " called ===");
        try {
            OrderDetailWithItemsResponse orderDetail = orderService.getOrderDetailByCode(orderCode);
            
            if (orderDetail == null) {
                return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng với mã: ", orderCode);
            }
            
            // Kiểm tra xem user hiện tại có quyền xem đơn hàng này không (optional - có thể bỏ qua nếu muốn public)
            if (jwt != null) {
                String userEmail = jwt.getClaimAsString("email");
                String userPhone = jwt.getClaimAsString("phone_number");
                
                // Kiểm tra xem order có thuộc về user hiện tại không
                boolean hasAccess = (orderDetail.getEmail() != null && orderDetail.getEmail().equals(userEmail)) ||
                                  (orderDetail.getPhoneNumber() != null && orderDetail.getPhoneNumber().equals(userPhone));
                
                if (!hasAccess) {
                    return ResponseEntityBuilder.error(HttpStatus.FORBIDDEN, "Bạn không có quyền xem đơn hàng này", "");
                }
            }
            
            return ResponseEntityBuilder.success(orderDetail);
        } catch (Exception e) {
            System.err.println("Error getting public order detail: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy chi tiết đơn hàng: ", e.getMessage());
        }
    }

    // Endpoint đơn giản để lấy thông tin nhân viên theo mã đơn hàng
    @GetMapping("/staff-info/{orderCode}")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> getStaffInfoByOrderCode(@PathVariable String orderCode) {
        System.out.println("=== GET /api/orders/staff-info/" + orderCode + " called ===");
        try {
            // Lấy app_user_id từ order
            Integer appUserId = orderService.getAppUserIdByOrderCode(orderCode);
            
            if (appUserId == null) {
                return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin nhân viên cho đơn hàng: ", orderCode);
            }
            
            // Lấy thông tin nhân viên từ AppUserService
            Optional<AppUser> staffInfo = appUserService.findById(appUserId);
            
            if (staffInfo == null) {
                return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin nhân viên với ID: ", appUserId.toString());
            }
            
            return ResponseEntityBuilder.success(staffInfo);
        } catch (Exception e) {
            System.err.println("Error getting staff info by order code: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy thông tin nhân viên: ", e.getMessage());
        }
    }
}