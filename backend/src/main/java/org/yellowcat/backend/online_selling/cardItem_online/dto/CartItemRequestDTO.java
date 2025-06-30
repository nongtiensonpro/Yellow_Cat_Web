package org.yellowcat.backend.online_selling.cardItem_online.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CartItemRequestDTO {
    private UUID keycloakId;
    private Integer variantId;
    private Integer cartItemId;
    private int quantity;
}
