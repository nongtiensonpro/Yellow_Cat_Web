package org.yellowcat.backend.product.cart;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.product.cart.dto.CartConfirmResponseDTO;
import org.yellowcat.backend.product.cart.dto.ConfirmCartRequestDTO;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /**
     * Xác nhận giỏ hàng để tới bước xác nhận đơn hàng(trừ tạm số lượng tồn kho và trả về thông tin đơn hàng)
     */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmCart(@RequestBody ConfirmCartRequestDTO request) {
        try {
            CartConfirmResponseDTO result = cartService.confirmCartItems(request.getKeycloakId(), request.getProducts());
            return ResponseEntity.ok(result);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * Hoàn lại kho nếu người dùng huỷ xác nhận
     */
    @PostMapping("/revert")
    public ResponseEntity<?> revertCart(@RequestParam UUID keycloakId) {
        try {
            cartService.revertCartItems(keycloakId);
            return ResponseEntity.ok("Đã hoàn lại kho cho giỏ hàng.");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    /**
     * Lấy thông tin giỏ hàng hiện tại của người dùng
     */
    @GetMapping
    public ResponseEntity<?> getUserCart(@RequestParam UUID keycloakId) {
        try {
            return ResponseEntity.ok(cartService.getCartByUser(keycloakId));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }
}
