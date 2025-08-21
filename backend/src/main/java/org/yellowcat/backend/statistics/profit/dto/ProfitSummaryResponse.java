package org.yellowcat.backend.statistics.profit.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfitSummaryResponse {
    private double revenue;
    private double costOfGoods;
    private double netProfit;
    private double profitMargin;   // tỷ suất lợi nhuận
    private double growthRate;     // tốc độ tăng trưởng lợi nhuận
    private double revenueGrowth;
    private double profitGrowth;
}

