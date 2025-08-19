package org.yellowcat.backend.statistics.overview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverviewResponseDTO {
    private BigDecimal revenue;
    private Long orders;
    private Long newCustomers;
    private double completionRate;
    private BigDecimal netProfit;
    private double cancelRate;
    private OrderStats orderStats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderStats {
        private int placed;
        private int delivered;
        private int cancelled;
    }
}
