package org.yellowcat.backend.product.cart.dto;

import lombok.Builder;
import lombok.Data;
import org.yellowcat.backend.product.cartItem.dto.CartItemSummaryDTO;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class CartConfirmResponseDTO {
    private List<CartItemSummaryDTO> items;
    private BigDecimal subTotal;
}
