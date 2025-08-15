package org.yellowcat.backend.product.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ProductHistoryDto {
    private int historyId;
    private UUID historyGroupId;
    private String productName;
    private String description;
    private String category;
    private String brand;
    private String material;
    private String targetAudience;
    private String thumbnail;
    private LocalDateTime changedAt;
    private String changedBy;
    private String operation;
}
