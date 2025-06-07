package org.yellowcat.backend.product.orderItem;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.orderItem.dto.OrderItemCreatedRequest;
import org.yellowcat.backend.product.orderItem.dto.OrderItemResponse;
import org.yellowcat.backend.product.orderItem.dto.UpdateOrderItemQuantityRequest;

@RestController
@RequestMapping("/api/order-items")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderItemController {
    OrderItemService orderItemService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> createOrderItem(@RequestBody OrderItemCreatedRequest request) {
        OrderItemResponse orderItem = orderItemService.createOrderItem(request);
        return ResponseEntityBuilder.success(orderItem);
    }

    @PutMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> updateOrderItemQuantity(@RequestBody UpdateOrderItemQuantityRequest request) {
        OrderItemResponse orderItem = orderItemService.updateOrderItemQuantity(request);
        return ResponseEntityBuilder.success(orderItem);
    }

    @DeleteMapping("/{orderItemId}")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    public ResponseEntity<?> deleteOrderItem(@PathVariable Integer orderItemId) {
        orderItemService.deleteOrderItem(orderItemId);
        return ResponseEntityBuilder.success("Order item deleted successfully");
    }
}
