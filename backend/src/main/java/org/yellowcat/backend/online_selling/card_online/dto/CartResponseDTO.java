package org.yellowcat.backend.online_selling.card_online.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class CartResponseDTO {
    private Integer cartId;
    private List<ItemResponseDTO> items;
}
