package org.yellowcat.backend.online_selling.cardItem_online;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.online_selling.cardItem_online.dto.CartItemRequestDTO;
import org.yellowcat.backend.online_selling.card_online.CartOnlineRepository;
import org.yellowcat.backend.product.cart.Cart;
import org.yellowcat.backend.product.cartItem.CartItem;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartItemOnlineService {
    private final CartOnlineRepository cartRepository;
    private final ProductVariantRepository variantRepository;
    private final CartItemOnlineRepository cartItemRepository;
    private final AppUserRepository userRepository;

    private static final int MIN_STOCK_FOR_ONLINE = 10;
    private static final int LARGE_QUANTITY_THRESHOLD = 20;

    @Transactional
    public void addToCart(CartItemRequestDTO dto) {
        AppUser user = userRepository.findByKeycloakId(dto.getKeycloakId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Cart cart = cartRepository.findByAppUser(user)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setAppUser(user);
                    return cartRepository.save(newCart);
                });

        ProductVariant variant = variantRepository.findById(dto.getVariantId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        Optional<CartItem> existingItem = cart.getCartItems().stream()
                .filter(i -> i.getVariant().getVariantId().equals(dto.getVariantId()))
                .findFirst();

        int newQuantity = dto.getQuantity();
        if (existingItem.isPresent()) {
            newQuantity += existingItem.get().getQuantity();
        }

        // Kiểm tra tồn kho và các ràng buộc
        validateQuantityRules(variant, newQuantity);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + dto.getQuantity());
            cartItemRepository.save(item);
        } else {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setVariant(variant);
            item.setQuantity(dto.getQuantity());
            cartItemRepository.save(item);
        }
    }

    @Transactional
    public void updateQuantity(CartItemRequestDTO dto) {
        CartItem item = cartItemRepository.findById(dto.getCartItemId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy item"));

        ProductVariant variant = item.getVariant();

        // Kiểm tra tồn kho và các ràng buộc
        validateQuantityRules(variant, dto.getQuantity());

        item.setQuantity(dto.getQuantity());
        cartItemRepository.save(item);
    }

    @Transactional
    public void removeItem(Integer cartItemId) {
        cartItemRepository.deleteById(cartItemId);
    }

    /**
     * Kiểm tra tồn kho và áp dụng các quy tắc kinh doanh:
     * - Ưu tiên bán offline nếu tồn kho thấp
     * - Chặn mua lẻ số lượng quá lớn
     * - Không vượt quá tồn kho
     */
    private void validateQuantityRules(ProductVariant variant, int requestedQuantity) {
        if (variant.getQuantityInStock() < MIN_STOCK_FOR_ONLINE) {
            throw new RuntimeException("Sản phẩm tạm hết hàng để ưu tiên bán tại cửa hàng. Vui lòng chọn sản phẩm khác.");
        }

        if (requestedQuantity >= LARGE_QUANTITY_THRESHOLD) {
            throw new RuntimeException("Số lượng đặt hàng lớn. Vui lòng liên hệ tư vấn viên để được hỗ trợ.");
        }

        if (variant.getQuantityInStock() < requestedQuantity) {
            throw new RuntimeException("Số lượng yêu cầu vượt quá tồn kho. Còn lại: " + variant.getQuantityInStock());
        }
    }
}
