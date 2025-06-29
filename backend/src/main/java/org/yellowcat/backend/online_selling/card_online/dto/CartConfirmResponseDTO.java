package org.yellowcat.backend.online_selling.card_online.dto;

import lombok.Builder;
import lombok.Data;
import org.yellowcat.backend.online_selling.cardItem_online.dto.CartItemSummaryDTO;

import java.math.BigDecimal;
import java.util.List;

@Builder
@Data
public class CartConfirmResponseDTO {
    private List<CartItemSummaryDTO> items;
    private BigDecimal subTotal;
}
