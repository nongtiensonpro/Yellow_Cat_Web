package org.yellowcat.backend.statistics.statisticsbyday;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Projection interface for product revenue detail query results
 */
public interface ProductRevenueDetailProjection {
    LocalDate getOrderDate();
    Long getProductId();
    String getProductName();
    Long getVariantId();
    String getCategoryName();
    String getBrandName();
    String getPaymentMethod();
    String getOrderStatus();
    String getShippingMethod();
    BigDecimal getTotalRevenue();
    Long getTotalUnitsSold();
    BigDecimal getAvgUnitPrice();
    Long getOrdersCount();
} 