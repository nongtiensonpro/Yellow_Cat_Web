package org.yellowcat.backend.online_selling.card_online;


import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.online_selling.cardItem_online.dto.CartItemSummaryDTO;
import org.yellowcat.backend.online_selling.card_online.dto.CartConfirmResponseDTO;
import org.yellowcat.backend.online_selling.card_online.dto.CartResponseDTO;
import org.yellowcat.backend.online_selling.card_online.dto.ItemResponseDTO;
import org.yellowcat.backend.online_selling.card_online.dto.ProductConfirmDTO;
import org.yellowcat.backend.product.cart.Cart;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class CartOnlineService {
    private final CartOnlineRepository cartRepository;
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
        List<ProductVariant> variantsToUpdate = new ArrayList<>();
        List<CartItemSummaryDTO> itemSummaries = new ArrayList<>();
        BigDecimal subTotal = BigDecimal.ZERO;

        try {
            // Trước tiên: check đủ hàng trước, chưa lưu gì cả
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

                // Ghi nhận sẽ trừ sau
                deductedMap.put(variantId, quantity);
                variantsToUpdate.add(variant);

                // Tính giá
                BigDecimal salePrice = variant.getSalePrice();
                BigDecimal unitPrice = (salePrice != null) ? salePrice : variant.getPrice();
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

            // Sau khi đảm bảo tất cả đủ hàng → mới thực hiện trừ và lưu
            for (ProductVariant variant : variantsToUpdate) {
                Integer quantity = deductedMap.get(variant.getVariantId());
                variant.setQuantityInStock(variant.getQuantityInStock() - quantity);
                variantRepository.save(variant);
            }

            // Lưu vào bộ nhớ tạm
            temporarilyDeductedCarts.put(keycloakId, deductedMap);

            return CartConfirmResponseDTO.builder()
                    .items(itemSummaries)
                    .subTotal(subTotal)
                    .build();

        } catch (RuntimeException e) {
            rollbackVariants(deductedMap); // nếu có lỗi, rollback lại
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

        // Trước tiên: kiểm tra tất cả sản phẩm có tồn tại không
        Map<ProductVariant, Integer> variantToRestoreMap = new HashMap<>();

        for (Map.Entry<Integer, Integer> entry : deductedMap.entrySet()) {
            Integer variantId = entry.getKey();
            Integer quantity = entry.getValue();

            ProductVariant variant = variantRepository.findById(variantId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + variantId));

            variantToRestoreMap.put(variant, quantity);
        }

        // Sau khi đảm bảo không lỗi mới bắt đầu hoàn lại kho
        for (Map.Entry<ProductVariant, Integer> entry : variantToRestoreMap.entrySet()) {
            ProductVariant variant = entry.getKey();
            Integer quantity = entry.getValue();

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

        List<ItemResponseDTO> itemDTOs = cart.getCartItems().stream().map(item -> {
            String productName = item.getVariant().getProduct().getProductName();
            String colorName = item.getVariant().getColor() != null ? item.getVariant().getColor().getName() : "";
            String sizeName = item.getVariant().getSize() != null ? item.getVariant().getSize().getName() : "";
            return ItemResponseDTO.builder()
                    .cartItemId(item.getCartItemId())
                    .variantId(item.getVariant().getVariantId())
                    .productName(productName)
                    .quantity(item.getQuantity())
                    .price(item.getVariant().getPrice())
                    .colorName(colorName)
                    .sizeName(sizeName)
                    .name(productName + " - " + colorName + " - " + sizeName)
                    .build();
        }).toList();

        return CartResponseDTO.builder()
                .cartId(cart.getCartId())
                .items(itemDTOs)
                .build();
    }
}
