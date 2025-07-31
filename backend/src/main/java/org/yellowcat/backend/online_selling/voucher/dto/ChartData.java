package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ChartData {
    private List<String> labels;         // Danh sách ngày (cho trục x)
    private List<Integer> usageCounts;    // Số lượt dùng theo ngày (cho trục y)
    private List<BigDecimal> salesData;   // Doanh thu theo ngày (cho trục y thứ 2)
    private List<String> displayLabels;   // Nhãn hiển thị (VD: "1/8: 15 lượt")
}
