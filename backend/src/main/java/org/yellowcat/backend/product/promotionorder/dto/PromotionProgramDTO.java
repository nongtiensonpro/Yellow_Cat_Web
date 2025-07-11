package org.yellowcat.backend.product.promotionorder.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PromotionProgramDTO {
    private Integer promotionProgramId;
    private String promotionCode;
    private String promotionName;
    private String description;
    private String discountType;
    private String discountValue;
    private String startDate;
    private String endDate;
    private Boolean isActive;
    private String minimumOrderValue;
    private Integer usageLimitPerUser;
    private Integer usageLimitTotal;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
}
