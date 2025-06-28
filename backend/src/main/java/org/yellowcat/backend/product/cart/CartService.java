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

    // Map: { keycloakId -> { variantId -> deductedQuantity } }
    private final Map<UUID, Map<Integer, Integer>> temporarilyDeductedCarts = new ConcurrentHashMap<>();

    /**
     * Xác nhận giỏ hàng: trừ tạm kho và trả về tổng giá trị từng sản phẩm + toàn bộ giỏ
     */
    @Transactional
    public CartConfirmResponseDTO confirmCartItems(UUID keycloakId, List<ProductConfirmDTO> selectedProducts) {
        Map<Integer, Integer> deductedMap = new HashMap<>();
        List<CartItemSummaryDTO> itemSummaries = new ArrayList<>();
        BigDecimal subTotal = BigDecimal.ZERO;

        try {
            for (ProductConfirmDTO selected : selectedProducts) {
                Integer variantId = selected.getVariantId();
                Integer quantity = selected.getQuantity();

                ProductVariant variant = variantRepository.findById(variantId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + variantId));

                if (variant.getQuantityInStock() < quantity) {
                    throw new RuntimeException("Sản phẩm '" + variant.getProduct().getProductName()
                            + "' không đủ hàng (còn " + variant.getQuantityInStock()
                            + ", yêu cầu: " + quantity + ").");
                }

                // Trừ tạm kho
                variant.setQuantityInStock(variant.getQuantityInStock() - quantity);
                variantRepository.save(variant);
                deductedMap.put(variantId, quantity);

                // Tính giá
                BigDecimal unitPrice = variant.getPrice();
                BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
                subTotal = subTotal.add(totalPrice);

                itemSummaries.add(CartItemSummaryDTO.builder()
                        .variantId(variantId)
                        .productName(variant.getProduct().getProductName())
                        .quantity(quantity)
                        .unitPrice(unitPrice)
                        .totalPrice(totalPrice)
                        .build());
            }

            // Lưu tạm trừ
            temporarilyDeductedCarts.put(keycloakId, deductedMap);

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
        Map<Integer, Integer> deductedMap = temporarilyDeductedCarts.get(keycloakId);

        if (deductedMap == null || deductedMap.isEmpty()) {
            throw new RuntimeException("Không có sản phẩm nào cần hoàn lại kho.");
        }

        for (Map.Entry<Integer, Integer> entry : deductedMap.entrySet()) {
            Integer variantId = entry.getKey();
            Integer quantity = entry.getValue();

            ProductVariant variant = variantRepository.findById(variantId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + variantId));

            variant.setQuantityInStock(variant.getQuantityInStock() + quantity);
            variantRepository.save(variant);
        }

        temporarilyDeductedCarts.remove(keycloakId);
    }

    /**
     * Rollback sản phẩm đã trừ kho nếu có lỗi trong quá trình xác nhận giỏ hàng
     */
    private void rollbackVariants(Map<Integer, Integer> deductedMap) {
        for (Map.Entry<Integer, Integer> entry : deductedMap.entrySet()) {
            Integer variantId = entry.getKey();
            Integer quantity = entry.getValue();

            ProductVariant variant = variantRepository.findById(variantId)
                    .orElse(null);
            if (variant != null) {
                variant.setQuantityInStock(variant.getQuantityInStock() + quantity);
                variantRepository.save(variant);
            }
        }
    }

    /**
     * Trả về giỏ hàng theo người dùng đã đăng nhập
     */
    @Transactional
    public CartResponseDTO getCartByUser(UUID keycloakId) {
        AppUser user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Cart cart = cartRepository.findByAppUser(user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng"));

        List<ItemResponseDTO> itemDTOs = cart.getCartItems().stream().map(item ->
                ItemResponseDTO.builder()
                        .cartItemId(item.getCartItemId())
                        .variantId(item.getVariant().getVariantId())
                        .productName(item.getVariant().getProduct().getProductName())
                        .quantity(item.getQuantity())
                        .price(item.getVariant().getPrice())
                        .build()
        ).toList();

        return CartResponseDTO.builder()
                .cartId(cart.getCartId())
                .items(itemDTOs)
                .build();
    }
}
