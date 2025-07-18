package org.yellowcat.backend.product.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailResponse {
    private Integer orderId;
    private String orderCode;
    private LocalDateTime orderDate;
    private String orderStatus;
    private String customerName;
    private String phoneNumber;
    private BigDecimal finalAmount;
    private BigDecimal subTotalAmount;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private String shippingMethod;
    private String recipientName;
    private String fullAddress;
    private String email;
    private String fullName;
    private String customerNotes;


} 