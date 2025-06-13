package org.yellowcat.backend.product.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.ToString;

import java.math.BigDecimal;

@AllArgsConstructor
@Getter
@ToString
public class OrderResponse {
    Integer orderId;
    String orderCode;
    String phoneNumber;
    String customerName;
    BigDecimal subTotalAmount;
    BigDecimal discountAmount;
    BigDecimal finalAmount;
    String orderStatus;
}
