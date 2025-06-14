package org.yellowcat.backend.statistics.statisticsbyday;


import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/revenue")
public class RevenueDataController {
    private final RevenueDataService service;

    public RevenueDataController(RevenueDataService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public List<RevenueData> getRevenueData(
            @RequestParam String startDate,
            @RequestParam String endDate
    ) {
        return service.getRevenueData(startDate, endDate);
    }
}