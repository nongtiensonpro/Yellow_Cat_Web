package org.yellowcat.backend.online_selling.card_online;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.online_selling.card_online.dto.CartConfirmResponseDTO;
import org.yellowcat.backend.online_selling.card_online.dto.ConfirmCartRequestDTO;
import org.yellowcat.backend.online_selling.card_online.dto.ProductConfirmDTO;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartOnlineController {
    private final CartOnlineService cartService;

    /**
     * Kiểm tra sản phẩm thiếu hàng, trả về danh sách lỗi nếu có
     */
    @PostMapping("/check-stock")
    public ResponseEntity<?> checkOutOfStock(@RequestBody ConfirmCartRequestDTO request) {
        try {
            Map<Integer, String> result = cartService.checkOutOfStockItems(request.getProducts());
            return ResponseEntity.ok(result);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * Xác nhận giỏ hàng: nếu thiếu hàng và allowWaitingOrder = false → không tạo đơn
     * nếu allowWaitingOrder = true → tạo đơn hàng chờ
     */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmCart(@RequestBody ConfirmCartRequestDTO request) {
        try {
            CartConfirmResponseDTO result = cartService.confirmCartItems(
                    request.getKeycloakId(),
                    request.getProducts(),
                    request.isAllowWaitingOrder()
            );
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
