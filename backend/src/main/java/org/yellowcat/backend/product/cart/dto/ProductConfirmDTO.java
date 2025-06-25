package org.yellowcat.backend.product.cart.dto;

import lombok.Data;

@Data
public class ProductConfirmDTO {
    private Integer variantId;
    private Integer quantity;
}
