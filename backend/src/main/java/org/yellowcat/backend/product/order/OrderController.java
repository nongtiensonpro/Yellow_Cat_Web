package org.yellowcat.backend.product.order;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.order.dto.OrderUpdateRequest;
import org.yellowcat.backend.product.order.dto.OrderUpdateResponse;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderController {
    OrderService orderService;

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