package org.yellowcat.backend.statistics.revenue.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RevenueSummaryResponse {
    private Long totalRevenue;
    private Double averageOrderValue;
    private Double growthRate;
}
