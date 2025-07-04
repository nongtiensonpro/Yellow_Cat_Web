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

        Optional<CartItem> existingItem = (cart.getCartItems() != null ? (java.util.List<CartItem>) cart.getCartItems() : java.util.Collections.<CartItem>emptyList())
                .stream()
                .filter(i -> i.getVariant().getVariantId().equals(dto.getVariantId()))
                .findFirst();

        int newQuantity = dto.getQuantity();
        if (existingItem.isPresent()) {
            newQuantity += existingItem.get().getQuantity();
        }

        if (variant.getQuantityInStockOnline() < newQuantity) {
            throw new RuntimeException("Số lượng yêu cầu vượt quá số lượng tồn kho. Còn lại: " + variant.getQuantityInStockOnline());
        }

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

    public void updateQuantity(CartItemRequestDTO dto) {
        CartItem item = cartItemRepository.findById(dto.getCartItemId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy item"));

        ProductVariant variant = item.getVariant();
        if (variant.getQuantityInStockOnline() < dto.getQuantity()) {
            throw new RuntimeException("Số lượng yêu cầu vượt quá số lượng tồn kho. Còn lại: " + variant.getQuantityInStockOnline());
        }

        item.setQuantity(dto.getQuantity());
        cartItemRepository.save(item);
    }

    public void removeItem(Integer cartItemId) {
        cartItemRepository.deleteById(cartItemId);
    }
}
