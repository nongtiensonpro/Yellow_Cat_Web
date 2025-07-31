package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.Data;
import org.yellowcat.backend.online_selling.voucher.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class VoucherDetailDTO {
    private Integer id;
    private String code;
    private String name;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer maxUsage;
    private Integer usageCount;
    private BigDecimal minOrderValue;
    private BigDecimal maxDiscountAmount;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<VoucherScopeDTO> scopes;

    // Thêm các trường thống kê hiệu suất
    private Integer redemptionCount;      // Số lần voucher đã được sử dụng
    private BigDecimal totalSales;        // Tổng doanh số từ voucher
    private Double redemptionRate;        // Tỉ lệ sử dụng (%): (redemptionCount / maxUsage) * 100
    private BigDecimal totalDiscount;     // Tổng tiền giảm giá
    private Integer remainingUsage;       // Số lượt s dụng voucher còn lại: maxUsage - redemptionCount
}

