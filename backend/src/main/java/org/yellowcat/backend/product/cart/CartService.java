package org.yellowcat.backend.product.cart;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.cart.dto.CartConfirmResponseDTO;
import org.yellowcat.backend.product.cart.dto.CartResponseDTO;
import org.yellowcat.backend.product.cart.dto.ItemResponseDTO;
import org.yellowcat.backend.product.cart.dto.ProductConfirmDTO;
import org.yellowcat.backend.product.cartItem.CartItem;
import org.yellowcat.backend.product.cartItem.dto.CartItemSummaryDTO;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final AppUserRepository userRepository;
    private final ProductVariantRepository variantRepository;

    // Giỏ hàng ID -> Map<variantId, quantity deducted>
    private final Map<Integer, Map<Integer, Integer>> temporarilyDeductedCarts = new ConcurrentHashMap<>();

    /**
     * Xác nhận giỏ hàng: trừ tạm kho và trả về tổng giá trị từng sản phẩm + toàn bộ giỏ
     */
    @Transactional
    public CartConfirmResponseDTO confirmCartItems(UUID keycloakId, List<ProductConfirmDTO> selectedProducts) {
        AppUser user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Cart cart = cartRepository.findByAppUser(user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng"));

        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống.");
        }

        Map<Integer, Integer> deductedMap = new HashMap<>();
        List<CartItemSummaryDTO> itemSummaries = new ArrayList<>();
        BigDecimal subTotal = BigDecimal.ZERO;

        try {
            for (ProductConfirmDTO selected : selectedProducts) {
                CartItem item = cart.getCartItems().stream()
                        .filter(ci -> ci.getVariant().getVariantId().equals(selected.getVariantId()))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Sản phẩm không nằm trong giỏ hàng"));

                if (selected.getQuantity() > item.getQuantity()) {
                    throw new RuntimeException("Số lượng yêu cầu vượt quá số lượng trong giỏ hàng.");
                }

                ProductVariant variant = item.getVariant();

                // Trừ tạm kho bằng cách gọi query an toàn
                int updated = variantRepository.deductStockIfEnough(variant.getVariantId(), selected.getQuantity());
                if (updated == 0) {
                    throw new RuntimeException("Sản phẩm '" + variant.getProduct().getProductName()
                            + "' không đủ hàng (yêu cầu: " + selected.getQuantity() + ").");
                }

                deductedMap.put(variant.getVariantId(), selected.getQuantity());

                // Tính giá
                BigDecimal unitPrice = variant.getPrice();
                BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(selected.getQuantity()));
                subTotal = subTotal.add(totalPrice).setScale(2, BigDecimal.ROUND_HALF_UP);

                itemSummaries.add(CartItemSummaryDTO.builder()
                        .variantId(variant.getVariantId())
                        .productName(variant.getProduct().getProductName())
                        .quantity(selected.getQuantity())
                        .unitPrice(unitPrice)
                        .totalPrice(totalPrice)
                        .imageUrl(variant.getImageUrl())
                        .build());
            }

            temporarilyDeductedCarts.put(cart.getCartId(), deductedMap);

            return CartConfirmResponseDTO.builder()
                    .items(itemSummaries)
                    .subTotal(subTotal)
                    .build();

        } catch (RuntimeException e) {
            rollbackVariants(deductedMap);
            throw e;
        }
    }

    /**
     * Hoàn lại kho nếu người dùng huỷ xác nhận mua hàng
     */
    @Transactional
    public void revertCartItems(UUID keycloakId) {
        AppUser user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Cart cart = cartRepository.findByAppUserWithItems(user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng"));

        Map<Integer, Integer> deductedMap = temporarilyDeductedCarts.get(cart.getCartId());
        if (deductedMap == null || deductedMap.isEmpty()) {
            throw new RuntimeException("Không có sản phẩm nào cần hoàn lại kho.");
        }

        for (CartItem item : cart.getCartItems()) {
            Integer variantId = item.getVariant().getVariantId();
            Integer qtyToRevert = deductedMap.get(variantId);

            if (qtyToRevert != null && qtyToRevert > 0) {
                ProductVariant variant = item.getVariant();
                variant.setQuantityInStock(variant.getQuantityInStock() + qtyToRevert);
                variantRepository.save(variant);
            }
        }

        temporarilyDeductedCarts.remove(cart.getCartId());
    }

    /**
     * Rollback sản phẩm đã trừ kho nếu có lỗi trong quá trình xác nhận giỏ hàng
     */
    private void rollbackVariants(Map<Integer, Integer> deductedVariants) {
        for (Map.Entry<Integer, Integer> entry : deductedVariants.entrySet()) {
            Integer variantId = entry.getKey();
            Integer quantity = entry.getValue();

            variantRepository.findById(variantId).ifPresent(variant -> {
                variant.setQuantityInStock(variant.getQuantityInStock() + quantity);
                variantRepository.save(variant);
            });
        }
    }

    /**
     * Trả về giỏ hàng theo người dùng
     */
    @Transactional
    public CartResponseDTO getCartByUser(UUID keycloakId) {
        AppUser user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Cart cart = cartRepository.findByAppUser(user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng"));

        List<ItemResponseDTO> itemDTOs = cart.getCartItems().stream().map(item -> {
            ProductVariant variant = item.getVariant();
            return ItemResponseDTO.builder()
                    .cartItemId(item.getCartItemId())
                    .variantId(variant.getVariantId())
                    .productName(variant.getProduct().getProductName())
                    .quantity(item.getQuantity())
                    .price(variant.getPrice())
                    .imageUrl(variant.getImageUrl())
                    .sku(variant.getSku())
                    .stockLevel(variant.getQuantityInStock())
                    .colorName(variant.getColor() != null ? variant.getColor().getName() : null)
                    .sizeName(variant.getSize() != null ? variant.getSize().getName() : null)
                    .build();
        }).toList();

        return CartResponseDTO.builder()
                .cartId(cart.getCartId())
                .items(itemDTOs)
                .build();
    }
}
