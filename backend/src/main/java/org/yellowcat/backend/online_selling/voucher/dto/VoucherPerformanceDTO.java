package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class VoucherPerformanceDTO {
    private Integer redemptionCount;      // Số lần voucher đã được sử dụng
    private BigDecimal totalSales;        // Tổng doanh số từ voucher
    private Double redemptionRate;        // Tỉ lệ sử dụng (%)
    private BigDecimal totalDiscount;     // Tổng tiền giảm giá
    private Integer remainingUsage;       // Số lượt sử dụng còn lại
    private String effectivenessStatus;   // Trạng thái hiệu quả
    private ChartData dailyUsageChart; // Số lần sử dụng theo ngày (key: "yyyy-MM-dd", value: số lần)
}
