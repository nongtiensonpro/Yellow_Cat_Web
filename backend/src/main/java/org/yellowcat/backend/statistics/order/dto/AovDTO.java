package org.yellowcat.backend.statistics.order.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AovDTO {
    private String month;
    private double averageOrderValue;
}