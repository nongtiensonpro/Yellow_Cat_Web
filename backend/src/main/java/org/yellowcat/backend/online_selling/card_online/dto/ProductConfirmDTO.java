package org.yellowcat.backend.online_selling.card_online.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Builder
@Data
public class ProductConfirmDTO {
    private Integer variantId;
    private Integer quantity;
}
