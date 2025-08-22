package org.yellowcat.backend.statistics.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MonthlyTrendDTO {
    private String month;  // Ví dụ: "T1", "T2"...
    private long orders;
}

