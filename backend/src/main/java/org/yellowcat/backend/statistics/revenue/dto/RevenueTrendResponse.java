package org.yellowcat.backend.statistics.revenue.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class RevenueTrendResponse {
    private List<String> labels;  // ["01/07", "02/07", ...]
    private List<Long> revenue;   // [2500000, 3200000, ...]
    private List<Integer> orders; // null nếu type != daily
}