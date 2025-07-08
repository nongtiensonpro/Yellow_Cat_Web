package org.yellowcat.backend.zalopay.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RefundRequestDTO {
    private String orderId;
    private String reason;
    private BigDecimal amount;
}
