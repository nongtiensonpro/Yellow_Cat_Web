package org.yellowcat.backend.product.order.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderUpdateResponse {
    Integer orderId;
    String orderCode;
    String phoneNumber;
    String customerName;
    BigDecimal subTotalAmount;
    BigDecimal discountAmount;
    BigDecimal finalAmount;
    String orderStatus;
    List<PaymentResponse> payments;

    @Data
    public static class PaymentResponse {
        Integer paymentId;
        String paymentMethod;
        BigDecimal amount;
        String paymentStatus;
    }
}