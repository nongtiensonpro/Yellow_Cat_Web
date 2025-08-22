package org.yellowcat.backend.statistics.order;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.yellowcat.backend.statistics.order.dto.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/statistic/orders")
@RequiredArgsConstructor
public class OrderStatisticController {
    private final OrderStatisticService analyticsService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<OrderSummaryDTO> getSummary(@RequestParam(defaultValue = "year") String range) {

        return ResponseEntity.ok(analyticsService.getSummary(range));
    }

    @GetMapping("/trends")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<List<MonthlyTrendDTO>> getTrends() {
        LocalDateTime now = LocalDateTime.now();
        int year = now.getYear();

        return ResponseEntity.ok(analyticsService.getTrends(year));
    }

    @GetMapping("/aov")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<List<AovDTO>> getAov() {
        LocalDateTime now = LocalDateTime.now();
        int year = now.getYear();

        return ResponseEntity.ok(analyticsService.getMonthlyAOV(year));
    }

    @GetMapping("/cancellation-rate")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<List<CancellationRateDTO>> getCancellationRate() {
        LocalDateTime now = LocalDateTime.now();
        int year = now.getYear();

        return ResponseEntity.ok(analyticsService.getMonthlyCancellationRate(year));
    }
}
