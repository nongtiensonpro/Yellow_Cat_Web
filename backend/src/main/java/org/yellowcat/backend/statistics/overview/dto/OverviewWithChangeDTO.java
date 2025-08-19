package org.yellowcat.backend.statistics.overview.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverviewWithChangeDTO {
    private OverviewResponseDTO current;
    private ChangeStats change;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangeStats {
        private double revenueChange;
        private double ordersChange;
        private double newCustomersChange;
        private double completionRateChange;
        private double netProfitChange;
        private double cancelRateChange;
    }
}
