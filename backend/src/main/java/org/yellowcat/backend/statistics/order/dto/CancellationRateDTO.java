package org.yellowcat.backend.statistics.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CancellationRateDTO {
    private String month;
    private double cancellationRate; // %
}
