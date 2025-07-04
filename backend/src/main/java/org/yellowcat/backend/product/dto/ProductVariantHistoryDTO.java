package org.yellowcat.backend.product.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ProductVariantHistoryDTO {
    private int historyId;
    private UUID historyGroupId;
    private String sku;
    private String color;
    private String size;
    private Integer quantityInStock;
    private String imageUrl;
    private Float weight;
    private String operation;
    private LocalDateTime changedAt;
    private String changedBy;
}
