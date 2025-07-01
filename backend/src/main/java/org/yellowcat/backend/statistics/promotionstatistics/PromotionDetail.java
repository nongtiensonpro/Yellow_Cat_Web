package org.yellowcat.backend.statistics.promotionstatistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromotionDetail {
    private Integer promotionId;
    private String promotionCode;
    private String promotionName;
    private String discountType;
    private BigDecimal discountValue;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private String status;
    
    // Computed fields
    private String formattedDiscountValue;
    private String statusDescription;
    private Long daysRemaining;
    
    public PromotionDetail(Integer promotionId, String promotionCode, String promotionName, 
                          String discountType, BigDecimal discountValue, LocalDateTime startDate, 
                          LocalDateTime endDate, Boolean isActive, String status) {
        this.promotionId = promotionId;
        this.promotionCode = promotionCode;
        this.promotionName = promotionName;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.startDate = startDate;
        this.endDate = endDate;
        this.isActive = isActive;
        this.status = status;
        
        // Set computed fields
        this.formattedDiscountValue = formatDiscountValue();
        this.statusDescription = getStatusDescription();
        this.daysRemaining = calculateDaysRemaining();
    }
    
    private String formatDiscountValue() {
        if (discountValue == null) return "0";
        
        return switch (discountType.toLowerCase()) {
            case "percentage" -> discountValue + "%";
            case "fixed_amount" -> String.format("%,.0f₫", discountValue);
            case "free_shipping" -> "Miễn phí vận chuyển";
            default -> discountValue.toString();
        };
    }
    
    private String getStatusDescription() {
        return switch (status) {
            case "ACTIVE" -> "Đang hoạt động";
            case "EXPIRED" -> "Đã kết thúc";
            case "UPCOMING" -> "Sắp diễn ra";
            case "INACTIVE" -> "Tạm dừng";
            default -> "Không xác định";
        };
    }
    
    private Long calculateDaysRemaining() {
        if (endDate == null) return null;
        
        LocalDateTime now = LocalDateTime.now();
        if ("ACTIVE".equals(status)) {
            return java.time.Duration.between(now, endDate).toDays();
        } else if ("UPCOMING".equals(status)) {
            return java.time.Duration.between(now, startDate).toDays();
        }
        return null;
    }
} 