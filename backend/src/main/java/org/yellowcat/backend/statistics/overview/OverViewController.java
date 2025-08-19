package org.yellowcat.backend.statistics.overview;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.yellowcat.backend.statistics.overview.dto.OverviewWithChangeDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/statistic/overviews")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class OverViewController {
    OverViewService overViewService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<OverviewWithChangeDTO> getOverview(
            @RequestParam(defaultValue = "month") String range) {
        return ResponseEntity.ok(overViewService.getOverview(range));
    }

    @GetMapping("/demo")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<Long> getTotalRevenue(@RequestParam(defaultValue = "month") String range) {

        return ResponseEntity.ok(overViewService.getTotalRevenue(range));
    }
}
