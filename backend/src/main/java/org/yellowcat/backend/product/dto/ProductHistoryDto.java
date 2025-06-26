package org.yellowcat.backend.product.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProductHistoryDto {
    private int historyId;
    private String productName;
    private String operation;
    private LocalDateTime changedAt;
    private String changedBy;
}
