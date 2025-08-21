package org.yellowcat.backend.statistics.product;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.statistics.product.dto.BestSellerDTO;
import org.yellowcat.backend.statistics.product.dto.LowStockDTO;
import org.yellowcat.backend.statistics.product.dto.ProductSummaryDTO;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@FieldDefaults(makeFinal = true, level = lombok.AccessLevel.PRIVATE)
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public class ProductStatisticService {
    ProductVariantStatisticRepository variantRepository;
    OrderStatisticRepository orderStatisticRepository;

    public ProductSummaryDTO getSummary(String range) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minus(1, toChronosUnit(range));

        Long total = orderStatisticRepository.findTotalProductsSold(start, end);
        Long lowStock = variantRepository.findLowStock(20);
        Long outOfStock = variantRepository.countOutOfStockProducts();
        Long bestSellers = orderStatisticRepository.findTopSellingProductQuantity(start, end);
        Long returned = orderStatisticRepository.countReturnedProducts(start, end);

        return ProductSummaryDTO.builder()
                .total(total != null ? total : 0)
                .lowStock(lowStock != null ? lowStock : 0)
                .outOfStock(outOfStock != null ? outOfStock : 0)
                .bestSellers(bestSellers != null ? bestSellers : 0)
                .returned(returned != null ? returned : 0)
                .build();
    }

    public List<BestSellerDTO> getBestSellers() {
        return variantRepository.findProductStatistics().stream()
                .map(row -> {
                    BestSellerDTO dto = new BestSellerDTO();
                    dto.setProductId(((Number) row[0]).intValue());       // product_id
                    dto.setName((String) row[1]);                          // product_name
                    dto.setCategory((String) row[2]);                      // category_name
                    dto.setBrand((String) row[3]);                         // brand_name
                    dto.setSales(((Number) row[4]).intValue());            // sales
                    dto.setRevenue(((Number) row[5]).doubleValue());       // revenue
                    dto.setStock(((Number) row[6]).intValue());            // stock
                    return dto;
                })
                .limit(5) // lấy Top 5
                .collect(Collectors.toList());
    }

    public List<LowStockDTO> getLowStock() {
        return variantRepository.findLowStockProducts(20).stream().map(v -> {
            LowStockDTO dto = new LowStockDTO();
            dto.setSku(v.getSku());
            dto.setName(v.getProduct().getProductName());
            dto.setCategory(v.getProduct().getCategory().getName());
            dto.setBrand(v.getProduct().getBrand().getBrandName());
            dto.setColor(v.getColor().getName());
            dto.setSize(v.getSize().getName());
            dto.setStock(v.getQuantityInStock());

            int threshold = 0;
            if (v.getQuantityInStock() <= 5) {
                threshold = 10;
            } else if (v.getQuantityInStock() <= 10) {
                threshold = 15;
            } else if (v.getQuantityInStock() <= 20) {
                threshold = 20;
            }
            dto.setThreshold(threshold);
            dto.setStatus(v.getQuantityInStock() <= 5 ? "critical" : "warning");
            return dto;
        }).collect(Collectors.toList());
    }

    private TemporalUnit toChronosUnit(String range) {
        return switch (range.toLowerCase()) {
            case "day" -> ChronoUnit.DAYS;
            case "week" -> ChronoUnit.WEEKS;
            case "month" -> ChronoUnit.MONTHS;
            case "year" -> ChronoUnit.YEARS;
            default -> throw new IllegalArgumentException("Invalid range: " + range);
        };
    }
}
