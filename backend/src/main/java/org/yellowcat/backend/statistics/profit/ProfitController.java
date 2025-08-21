package org.yellowcat.backend.statistics.profit;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.yellowcat.backend.statistics.profit.dto.*;

@RestController
@RequestMapping("/api/statistic/profit")
@RequiredArgsConstructor
public class ProfitController {
    private final ProfitService profitService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<ProfitSummaryResponse> getSummary(
            @RequestParam(defaultValue = "year") String range
    ) {
        return ResponseEntity.ok(profitService.getSummary(range));
    }

    @GetMapping("/trends")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<ProfitTrendResponse> getTrends(
            @RequestParam(defaultValue = "year") String range,
            @RequestParam(defaultValue = "weekly") String period
    ) {
        return ResponseEntity.ok(profitService.getTrends(range, period));
    }

    @GetMapping("/margins")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<ProfitMarginsResponse> getMargins(
            @RequestParam(defaultValue = "year") String range,
            @RequestParam(defaultValue = "weekly") String period
    ) {
        return ResponseEntity.ok(profitService.getMargins(range, period));
    }
}
