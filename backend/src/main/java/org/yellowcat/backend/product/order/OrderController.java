package org.yellowcat.backend.product.order;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
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
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<OrderResponse> orders = orderService.getOrderByStatus(page, size);
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
}