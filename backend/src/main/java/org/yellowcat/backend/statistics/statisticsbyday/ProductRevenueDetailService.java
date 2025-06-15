package org.yellowcat.backend.statistics.statisticsbyday;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductRevenueDetailService {
    private final ProductRevenueDetailRepository repository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public ProductRevenueDetailService(ProductRevenueDetailRepository repository) {
        this.repository = repository;
    }

    public List<ProductRevenueDetail> getProductRevenueDetail(String startDate, String endDate) {
        try {
            // Convert String to LocalDate
            LocalDate start = LocalDate.parse(startDate, DATE_FORMATTER);
            LocalDate end = LocalDate.parse(endDate, DATE_FORMATTER);
            
            // Validate date range
            if (start.isAfter(end)) {
                throw new IllegalArgumentException("Ngày bắt đầu không thể sau ngày kết thúc");
            }
            
            if (start.isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("Ngày bắt đầu không thể trong tương lai");
            }
            
            // Get projections and convert to ProductRevenueDetail objects
            List<ProductRevenueDetailProjection> projections = repository.findProductRevenueDetailBetween(start, end);
            
            return projections.stream()
                    .map(this::convertToProductRevenueDetail)
                    .collect(Collectors.toList());
            
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng yyyy-MM-dd", e);
        }
    }
    
    private ProductRevenueDetail convertToProductRevenueDetail(ProductRevenueDetailProjection projection) {
        return new ProductRevenueDetail(
                projection.getOrderDate(),
                projection.getProductId(),
                projection.getProductName(),
                projection.getVariantId(),
                projection.getCategoryName(),
                projection.getBrandName(),
                projection.getPaymentMethod(),
                projection.getOrderStatus(),
                projection.getShippingMethod(),
                projection.getTotalRevenue(),
                projection.getTotalUnitsSold(),
                projection.getAvgUnitPrice(),
                projection.getOrdersCount()
        );
    }
} 