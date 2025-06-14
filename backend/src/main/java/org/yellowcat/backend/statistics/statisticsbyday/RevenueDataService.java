package org.yellowcat.backend.statistics.statisticsbyday;


import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RevenueDataService {
    private final RevenueDataRepository repository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public RevenueDataService(RevenueDataRepository repository) {
        this.repository = repository;
    }

    public List<RevenueData> getRevenueData(String startDate, String endDate) {
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
            
            // Get projections and convert to RevenueData objects
            List<RevenueDataProjection> projections = repository.findRevenueDataBetween(start, end);
            
            return projections.stream()
                    .map(this::convertToRevenueData)
                    .collect(Collectors.toList());
            
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng yyyy-MM-dd", e);
        }
    }
    
    private RevenueData convertToRevenueData(RevenueDataProjection projection) {
        return new RevenueData(
                projection.getRevenueDate(),
                projection.getTotalRevenue(),
                projection.getTotalUnitsSold()
        );
    }
}