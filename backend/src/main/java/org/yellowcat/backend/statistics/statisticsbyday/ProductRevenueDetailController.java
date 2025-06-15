package org.yellowcat.backend.statistics.statisticsbyday;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/product-revenue-detail")
public class ProductRevenueDetailController {
    private final ProductRevenueDetailService service;

    public ProductRevenueDetailController(ProductRevenueDetailService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public List<ProductRevenueDetail> getProductRevenueDetail(
            @RequestParam String startDate,
            @RequestParam String endDate
    ) {
        return service.getProductRevenueDetail(startDate, endDate);
    }
} 