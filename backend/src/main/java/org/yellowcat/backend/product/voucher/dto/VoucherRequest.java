package org.yellowcat.backend.product.voucher.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class VoucherRequest {
    private String promotionName;
    private String voucherCode;
    private String description;
    private String discountType;
    private BigDecimal discountValue;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BigDecimal minimumOrderValue;
    private BigDecimal maximumDiscountValue;
    private Integer usageLimitPerUser;
    private Integer usageLimitTotal;
    private Boolean isStackable;
    private Boolean isActive;
} 