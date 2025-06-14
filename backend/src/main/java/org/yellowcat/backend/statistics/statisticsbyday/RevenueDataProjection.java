package org.yellowcat.backend.statistics.statisticsbyday;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Projection interface for revenue data query results
 */
public interface RevenueDataProjection {
    LocalDate getRevenueDate();
    BigDecimal getTotalRevenue();
    Long getTotalUnitsSold();
} 