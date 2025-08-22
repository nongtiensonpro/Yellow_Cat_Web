package org.yellowcat.backend.statistics.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderSummaryDTO {
    private long totalOrder;
    private long processing;
    private long shipped;
    private long delivered;
    private long cancelled;
    private long returned;
    private double totalRevenue;
    private double avgOrderValue;
    private double processingRate;
    private double shippedRate;
    private double completionRate;
    private double cancellationRate;
    private double returnRate;
    private double totalOrderGrowth;
    private double avgOrderValueGrowth;
    private double completionRateGrowth;
    private double cancellationRateGrowth;
    private double returnRateGrowth;
}
