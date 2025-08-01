package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DailyUsageStats {
    private int usageCount;       // Số lần sử dụng
    private BigDecimal sales;     // Doanh thu trong ngày

    public DailyUsageStats(int usageCount, BigDecimal sales) {
        this.usageCount = usageCount;
        this.sales = sales != null ? sales : BigDecimal.ZERO;
    }
}
