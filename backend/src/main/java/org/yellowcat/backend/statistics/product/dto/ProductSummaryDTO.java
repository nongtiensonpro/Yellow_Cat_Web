package org.yellowcat.backend.statistics.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProductSummaryDTO {
    private long total;
    private long lowStock;
    private long outOfStock;
    private long bestSellers;
    private long returned;
}
