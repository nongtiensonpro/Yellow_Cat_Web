package org.yellowcat.backend.product.returnRequest.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReturnItemResponseDTO {
    private Integer returnItemId;
    private Integer orderItemId;
    private String productName;
    private Integer quantityReturned;
    private BigDecimal refundAmount;
    private String reason;
}