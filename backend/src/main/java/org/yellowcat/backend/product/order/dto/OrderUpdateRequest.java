package org.yellowcat.backend.product.order.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderUpdateRequest {
    Integer orderId;
    String phoneNumber;
    String customerName;
    BigDecimal discountAmount;
    List<PaymentUpdateRequest> payments;

    @Data
    public static class PaymentUpdateRequest {
        Integer paymentId;
        String paymentMethod;
        String transactionId;
        BigDecimal amount;
        String paymentStatus;
    }
}