package org.yellowcat.backend.online_selling.cardItem_online;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.online_selling.cardItem_online.dto.CartItemRequestDTO;

@RestController
@RequestMapping("/api/cart-items")
@RequiredArgsConstructor
public class CartItemOnlineController {
    private final CartItemOnlineService cartItemService;

    // Thêm sản phẩm vào giỏ hàng
    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody CartItemRequestDTO dto) {
        try {
            cartItemService.addToCart(dto);
            return ResponseEntityBuilder.success("Đã thêm vào giỏ hàng");
        } catch (RuntimeException e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, e.getMessage(), null);
        }
    }

    // Cập nhật số lượng sản phẩm
    @PutMapping("/update")
    public ResponseEntity<?> updateQuantity(@RequestBody CartItemRequestDTO dto) {
        try {
            cartItemService.updateQuantity(dto);
            return ResponseEntityBuilder.success("Cập nhật số lượng thành công");
        } catch (RuntimeException e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, e.getMessage(), null);
        }
    }

    // Xoá sản phẩm khỏi giỏ hàng
    @DeleteMapping("/remove/{cartItemId}")
    public ResponseEntity<?> removeItem(@PathVariable Integer cartItemId) {
        try {
            cartItemService.removeItem(cartItemId);
            return ResponseEntityBuilder.success("Xóa sản phẩm khỏi giỏ hàng thành công");
        } catch (RuntimeException e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, e.getMessage(), null);
        }
    }
}
