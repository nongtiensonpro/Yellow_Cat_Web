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
        private final Map<UUID, Map<Integer, Integer>> temporarilyDeductedCarts = new ConcurrentHashMap<>();

        /**
         * Kiểm tra sản phẩm thiếu hàng trước khi xác nhận đơn
         */
        @Transactional
        public Map<Integer, String> checkOutOfStockItems(List<ProductConfirmDTO> selectedProducts) {
            Map<Integer, String> outOfStockMessages = new HashMap<>();
            for (ProductConfirmDTO selected : selectedProducts) {
                Integer variantId = selected.getVariantId();
                Integer requestedQty = selected.getQuantity();

                ProductVariant variant = variantRepository.findById(variantId).orElse(null);
                if (variant != null && variant.getQuantityInStock() < requestedQty) {
                    outOfStockMessages.put(variantId, "Sản phẩm '" + variant.getProduct().getProductName()
                            + "' không đủ hàng (còn " + variant.getQuantityInStock()
                            + ", yêu cầu: " + requestedQty + ").");
                }
            }
            return outOfStockMessages;
        }

        /**
         * Xác nhận giỏ hàng: nếu allowWaitingOrder = true thì vẫn tạo đơn chờ nếu thiếu hàng
         */
        @Transactional
        public CartConfirmResponseDTO confirmCartItems(UUID keycloakId, List<ProductConfirmDTO> selectedProducts, boolean allowWaitingOrder) {
            Map<Integer, Integer> deductedMap = new HashMap<>();
            List<CartItemSummaryDTO> itemSummaries = new ArrayList<>();
            BigDecimal subTotal = BigDecimal.ZERO;
            boolean hasOutOfStock = false;
            Map<Integer, String> outOfStockItems = new HashMap<>();

            try {
                for (ProductConfirmDTO selected : selectedProducts) {
                    Integer variantId = selected.getVariantId();
                    Integer requestedQty = selected.getQuantity();

                    ProductVariant variant = variantRepository.findById(variantId)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + variantId));

                    int availableQty = variant.getQuantityInStock();
                    BigDecimal unitPrice = Optional.ofNullable(variant.getSalePrice()).orElse(variant.getPrice());
                    BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(requestedQty));
                    subTotal = subTotal.add(totalPrice);

                    itemSummaries.add(CartItemSummaryDTO.builder()
                            .variantId(variantId)
                            .productName(variant.getProduct().getProductName())
                            .quantity(requestedQty)
                            .unitPrice(unitPrice)
                            .totalPrice(totalPrice)
                            .build());

                    if (availableQty < requestedQty) {
                        hasOutOfStock = true;
                        outOfStockItems.put(variantId, "Sản phẩm '" + variant.getProduct().getProductName()
                                + "' không đủ hàng (còn " + availableQty + ", yêu cầu: " + requestedQty + ").");
                    } else {
                        deductedMap.put(variantId, requestedQty);
                    }
                }

                boolean canProceed = !hasOutOfStock || allowWaitingOrder;

                if (canProceed) {
                    for (ProductConfirmDTO selected : selectedProducts) {
                        Integer variantId = selected.getVariantId();
                        Integer requestedQty = selected.getQuantity();

                        ProductVariant variant = variantRepository.findById(variantId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + variantId));

                        // Trừ tồn kho với những sản phẩm còn đủ
                        if (variant.getQuantityInStock() >= requestedQty) {
                            variant.setQuantityInStock(variant.getQuantityInStock() - requestedQty);
                            deductedMap.put(variantId, requestedQty);
                            variantRepository.save(variant);
                        }
                    }
                    temporarilyDeductedCarts.put(keycloakId, deductedMap);
                }

                String orderStatus = !hasOutOfStock ? "Pending" : (allowWaitingOrder ? "WaitingForStock" : "Pending");

                return CartConfirmResponseDTO.builder()
                        .items(itemSummaries)
                        .subTotal(subTotal)
                        .waitingForStock(hasOutOfStock)
                        .outOfStockMessages(outOfStockItems)
                        .canProceed(canProceed)
                        .orderStatus(orderStatus)
                        .build();

            } catch (RuntimeException e) {
                rollbackVariants(deductedMap);
                throw e;
            }
        }

        @Transactional
        public void revertCartItems(UUID keycloakId) {
            Map<Integer, Integer> deductedMap = temporarilyDeductedCarts.get(keycloakId);
            if (deductedMap == null) return;

            for (Map.Entry<Integer, Integer> entry : deductedMap.entrySet()) {
                if (entry.getValue() <= 0) continue;
                ProductVariant variant = variantRepository.findById(entry.getKey()).orElse(null);
                if (variant != null) {
                    variant.setQuantityInStock(variant.getQuantityInStock() + entry.getValue());
                    variantRepository.save(variant);
                }
            }
            temporarilyDeductedCarts.remove(keycloakId);
        }

        private void rollbackVariants(Map<Integer, Integer> deductedMap) {
            for (Map.Entry<Integer, Integer> entry : deductedMap.entrySet()) {
                if (entry.getValue() <= 0) continue;
                ProductVariant variant = variantRepository.findById(entry.getKey()).orElse(null);
                if (variant != null) {
                    variant.setQuantityInStock(variant.getQuantityInStock() + entry.getValue());
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
                var variant = item.getVariant();
                var product = variant.getProduct();

                return ItemResponseDTO.builder()
                        .cartItemId(item.getCartItemId())
                        .variantId(variant.getVariantId())
                        .productName(product.getProductName())
                        .quantity(item.getQuantity())
                        .price(variant.getPrice())
                        .salePrice(variant.getSalePrice()) // Thêm dòng này
                        .colorName(variant.getColor().getName())
                        .sizeName(variant.getSize().getName())
                        .imageUrl(variant.getImageUrl())
                        .sku(variant.getSku())
                        .stockLevel(variant.getQuantityInStock())
                        .build();
            }).toList();

            return CartResponseDTO.builder()
                    .cartId(cart.getCartId())
                    .items(itemDTOs)
                    .build();
        }
    }
