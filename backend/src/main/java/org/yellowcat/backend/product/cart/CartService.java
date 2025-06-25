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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final AppUserRepository userRepository;
    private final ProductVariantRepository variantRepository;

    // Lưu tạm các variant đã trừ để hoàn lại nếu cần
    private final Map<Integer, Set<Integer>> temporarilyDeductedCarts = new HashMap<>();

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

        Map<ProductVariant, Integer> deductedVariants = new HashMap<>();
        List<CartItemSummaryDTO> itemSummaries = new ArrayList<>();
        BigDecimal subTotal = BigDecimal.ZERO;

        try {
            for (ProductConfirmDTO selected : selectedProducts) {
                CartItem item = cart.getCartItems().stream()
                        .filter(ci -> ci.getVariant().getVariantId().equals(selected.getVariantId()))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Sản phẩm không nằm trong giỏ hàng"));

                if (selected.getQuantity() > item.getQuantity()) {
                    throw new RuntimeException("Số lượng yêu cầu vượt quá trong giỏ hàng");
                }

                ProductVariant variant = item.getVariant();

                if (variant.getQuantityInStock() < selected.getQuantity()) {
                    throw new RuntimeException("Sản phẩm '" + variant.getProduct().getProductName()
                            + "' không đủ hàng (còn " + variant.getQuantityInStock()
                            + ", yêu cầu: " + selected.getQuantity() + ").");
                }

                // Trừ tạm kho
                variant.setQuantityInStock(variant.getQuantityInStock() - selected.getQuantity());
                variantRepository.save(variant);
                deductedVariants.put(variant, selected.getQuantity());

                // Tính giá
                BigDecimal unitPrice = variant.getPrice();
                BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(selected.getQuantity()));
                subTotal = subTotal.add(totalPrice);

                itemSummaries.add(CartItemSummaryDTO.builder()
                        .variantId(variant.getVariantId())
                        .productName(variant.getProduct().getProductName())
                        .quantity(selected.getQuantity())
                        .unitPrice(unitPrice)
                        .totalPrice(totalPrice)
                        .build());
            }

            // Lưu ID các sản phẩm đã xác nhận
            Set<Integer> deductedIds = deductedVariants.keySet().stream()
                    .map(ProductVariant::getVariantId)
                    .collect(Collectors.toSet());

            temporarilyDeductedCarts.put(cart.getCartId(), deductedIds);

            return CartConfirmResponseDTO.builder()
                    .items(itemSummaries)
                    .subTotal(subTotal)
                    .build();

        } catch (RuntimeException e) {
            rollbackVariants(deductedVariants);
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

        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống, không có sản phẩm để hoàn lại kho.");
        }

        Set<Integer> deductedIds = temporarilyDeductedCarts.get(cart.getCartId());
        if (deductedIds == null || deductedIds.isEmpty()) {
            throw new RuntimeException("Không có sản phẩm nào cần hoàn lại kho.");
        }

        for (CartItem item : cart.getCartItems()) {
            if (deductedIds.contains(item.getVariant().getVariantId())) {
                ProductVariant variant = item.getVariant();
                variant.setQuantityInStock(variant.getQuantityInStock() + item.getQuantity());
                variantRepository.save(variant);
            }
        }

        temporarilyDeductedCarts.remove(cart.getCartId());
    }

    /**
     * Rollback sản phẩm đã trừ kho nếu có lỗi trong quá trình xác nhận giỏ hàng
     */
    private void rollbackVariants(Map<ProductVariant, Integer> deductedVariants) {
        for (Map.Entry<ProductVariant, Integer> entry : deductedVariants.entrySet()) {
            ProductVariant variant = entry.getKey();
            Integer quantity = entry.getValue();
            variant.setQuantityInStock(variant.getQuantityInStock() + quantity);
            variantRepository.save(variant);
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

        List<ItemResponseDTO> itemDTOs = cart.getCartItems().stream().map(item ->
                ItemResponseDTO.builder()
                        .cartItemId(item.getCartItemId()) // Thêm dòng này
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
