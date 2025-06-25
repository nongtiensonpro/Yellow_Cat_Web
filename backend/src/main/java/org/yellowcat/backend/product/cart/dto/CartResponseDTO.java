package org.yellowcat.backend.product.cart.dto;

import lombok.Builder;
import lombok.Data;
import org.yellowcat.backend.product.cartItem.dto.CartItemDTO;

import java.util.List;

@Data
@Builder
public class CartResponseDTO {
    private Integer cartId;
    private List<ItemResponseDTO> items;
}
