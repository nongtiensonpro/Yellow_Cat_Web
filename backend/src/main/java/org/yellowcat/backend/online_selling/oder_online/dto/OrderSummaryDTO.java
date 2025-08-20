package org.yellowcat.backend.online_selling.oder_online.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class OrderSummaryDTO {
    private Integer orderId;
    private String orderCode;
    private String customerName;
    private String orderStatus;
    private BigDecimal finalAmount;
    private BigDecimal discountAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
