package org.yellowcat.backend.product.productvariant.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProductVariantHistoryDto {
    private int historyId;
    private String sku;
    private String operation;
    private LocalDateTime changedAt;
    private String changedBy;
}
