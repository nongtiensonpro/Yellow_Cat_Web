package org.yellowcat.backend.product.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface OrderDetailProjection {
    Integer getOrderId();
    String getOrderCode();
    LocalDateTime getOrderDate();
    String getOrderStatus();
    String getCustomerName();
    String getPhoneNumber();
    BigDecimal getFinalAmount();
    BigDecimal getSubTotalAmount();
    BigDecimal getShippingFee();
    BigDecimal getDiscountAmount();
    String getShippingMethod();
    String getRecipientName();
    String getFullAddress();
    String getEmail();
    String getFullName();
    String getCustomerNotes();
} 