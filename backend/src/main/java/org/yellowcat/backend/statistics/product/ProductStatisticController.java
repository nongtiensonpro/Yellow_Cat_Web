package org.yellowcat.backend.statistics.product;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.yellowcat.backend.statistics.product.dto.BestSellerDTO;
import org.yellowcat.backend.statistics.product.dto.LowStockDTO;
import org.yellowcat.backend.statistics.product.dto.ProductSummaryDTO;

import java.util.List;

@RestController
@RequestMapping("/api/statistic/product")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class ProductStatisticController {
    ProductStatisticService productStatisticService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<ProductSummaryDTO> getSummary(
            @RequestParam(defaultValue = "year") String range
    ) {
        return ResponseEntity.ok(productStatisticService.getSummary(range));
    }

    @GetMapping("/best-sellers")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<List<BestSellerDTO>> getBestSellers() {
        return ResponseEntity.ok(productStatisticService.getBestSellers());
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<List<LowStockDTO>> getLowStock() {
        return ResponseEntity.ok(productStatisticService.getLowStock());
    }
}
