package org.yellowcat.backend.statistics.statisticsbyday;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Immutable
public class RevenueData {
    @Id
    @Column(name = "revenue_date")
    private LocalDate revenueDate;
    
    @Column(name = "total_revenue")
    private BigDecimal totalRevenue;
    
    @Column(name = "total_units_sold")
    private Long totalUnitsSold;

    public RevenueData() {}

    public RevenueData(LocalDate revenueDate, BigDecimal totalRevenue, Long totalUnitsSold) {
        this.revenueDate = revenueDate;
        this.totalRevenue = totalRevenue;
        this.totalUnitsSold = totalUnitsSold;
    }

    public LocalDate getRevenueDate() {
        return revenueDate;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public Long getTotalUnitsSold() {
        return totalUnitsSold;
    }
}