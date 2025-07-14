package org.yellowcat.backend.product.promotionorder.dto;

import lombok.Data;

@Data
public class PromotionOrderRequest {
    private String promotionName;
    private String description;
    private String discountType;
    private String discountValue; // Changed to String to handle different formats
    private String startDate; // Changed to String for easier JSON serialization
    private String endDate; // Changed to String for easier JSON serialization
    private String minimumOrderValue; // Changed to String for easier JSON serialization
    private Integer usageLimitPerUser;
    private Integer usageLimitTotal;

    // Thêm vào để nhận giá trị giảm tối đa khi loại là "percentage"
    private String maxDiscountValue;
}
