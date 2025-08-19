package org.yellowcat.backend.statistics.revenue;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.yellowcat.backend.statistics.revenue.dto.*;

import java.util.List;

@RestController
@RequestMapping("/api/statistic/revenue")
public class RevenueController {
    @Autowired
    RevenueService revenueService;

    @GetMapping("/trend")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<RevenueTrendResponse> getRevenueTrend(
            @RequestParam(defaultValue = "daily") String type,
            @RequestParam(defaultValue = "month") String range
    ) {

        return ResponseEntity.ok(revenueService.getRevenueTrend(type, range));
    }

    /**
     * Lấy thống kê doanh thu theo danh mục.
     *
     * @param range thay đổi theo thời gian
     * @return Danh sách RevenueByCategoryResponse chứa doanh thu theo từng danh mục
     */
    @GetMapping("/by-category")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<List<RevenueByCategoryResponse>> getByCategory(
            @RequestParam(defaultValue = "month") String range) {

        List<RevenueByCategoryResponse> response = revenueService.getRevenueByCategory(range);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thống kê doanh thu theo thương hiệu.
     *
     * @param range thay đổi theo thời gian
     * @return Danh sách RevenueByCategoryResponse chứa doanh thu theo từng thương hiệu
     */
    @GetMapping("/by-brand")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<List<RevenueByBrandResponse>> getByBrand(
            @RequestParam(defaultValue = "month") String range) {

        List<RevenueByBrandResponse> response = revenueService.getRevenueByBrand(range);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thống kê doanh thu tổng hợp.
     *
     * @param range thay đổi theo thời gian
     * @return RevenueSummaryResponse chứa thông tin tổng hợp doanh thu
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<RevenueSummaryResponse> getSummary(
            @RequestParam(defaultValue = "month") String range) {

        RevenueSummaryResponse response = revenueService.getSummary(range);
        return ResponseEntity.ok(response);
    }
}
