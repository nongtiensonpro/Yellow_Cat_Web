package org.yellowcat.backend.online_selling.card_online.dto;

import lombok.Builder;
import lombok.Data;
import org.yellowcat.backend.online_selling.cardItem_online.dto.CartItemSummaryDTO;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Builder
@Data
public class CartConfirmResponseDTO {
    private List<CartItemSummaryDTO> items;
    private BigDecimal subTotal;
    private boolean waitingForStock;
    private Map<Integer, String> outOfStockMessages;
    private boolean canProceed;  // true nếu có thể tạo đơn, false nếu còn thiếu hàng và chưa cho phép
    private String orderStatus;
}
