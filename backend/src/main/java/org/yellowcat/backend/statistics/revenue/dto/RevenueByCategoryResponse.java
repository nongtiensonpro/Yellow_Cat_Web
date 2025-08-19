package org.yellowcat.backend.statistics.revenue.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RevenueByCategoryResponse {
    private String categoryName;
    private Long totalRevenue;
}