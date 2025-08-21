package org.yellowcat.backend.statistics.profit.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfitTrendResponse {
    private List<String> labels;
    private Map<String, List<Double>> datasets; // revenue, grossProfit, netProfit
}
