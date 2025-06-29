package org.yellowcat.backend.online_selling.oder_online.dto;


import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrderResponseDTO {
    private Integer orderId;
    private String orderCode;
    private String orderStatus;
    private String customerName;
    private String phoneNumber;
    private String shippingAddress;
    private BigDecimal finalAmount;
}
