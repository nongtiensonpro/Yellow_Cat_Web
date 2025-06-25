package org.yellowcat.backend.product.cartItem.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class CartItemRequestDTO {
    private UUID keycloakId;
    private Integer variantId;
    private Integer cartItemId;
    private int quantity;
}
