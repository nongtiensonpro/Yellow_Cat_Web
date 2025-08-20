package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ChartData {
    private List<String> labels;         // Danh sách ngày (cho trục x)
    private List<Integer> usageCounts;    // Số lượt dùng theo ngày (cho trục y)
    private List<BigDecimal> salesData;   // Doanh thu theo ngày (cho trục y thứ 2)
    private List<BigDecimal> profitData;  // Lợi nhuận theo ngày (cho trục y thứ 3)
    private List<String> displayLabels;   // Nhãn hiển thị (VD: "1/8: 15 lượt")

    // Pagination + range metadata
    private String rangeStart;            // yyyy-MM-dd của ngày đầu khung hiển thị
    private String rangeEnd;              // yyyy-MM-dd của ngày cuối khung hiển thị
    private Integer page;                 // Trang hiện tại (1-based)
    private Integer pageSize;             // Số ngày mỗi trang (mặc định 7)
    private Integer totalPages;           // Tổng số trang
    private Integer totalDays;            // Tổng số ngày trong toàn bộ khoảng (start->end)
}
