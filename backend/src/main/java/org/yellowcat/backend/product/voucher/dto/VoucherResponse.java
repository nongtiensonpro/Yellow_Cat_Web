package org.yellowcat.backend.product.voucher.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class VoucherResponse {
    private Integer voucherId;
    private String voucherCode;
    private String voucherName;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 