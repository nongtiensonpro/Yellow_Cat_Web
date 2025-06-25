package org.yellowcat.backend.product.orderItem.dto;

import java.math.BigDecimal;

public interface OrderItemDetailProjection {
    // Thông tin order item
    Integer getOrderItemId();
    Integer getOrderId();
    Integer getQuantity();
    BigDecimal getPriceAtPurchase();
    BigDecimal getTotalPrice();
    
    // Thông tin product variant
    Integer getVariantId();
    String getSku();
    String getProductName();
    String getColorName();
    String getSizeName();
    String getMaterialName();
    String getBrandName();
    String getCategoryName();
    String getTargetAudienceName();
    BigDecimal getCurrentPrice();
    BigDecimal getSalePrice();
    String getImageUrl();
    Double getWeight();
    Integer getQuantityInStock();
} 