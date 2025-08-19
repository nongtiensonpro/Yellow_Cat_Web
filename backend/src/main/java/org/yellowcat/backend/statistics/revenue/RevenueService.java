package org.yellowcat.backend.statistics.revenue;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.statistics.revenue.dto.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class RevenueService {
    RevenueRepository revenueRepository;

    public RevenueTrendResponse getRevenueTrend(String type, String range) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minus(1, toChronoUnit(range));

        List<String> labels = new ArrayList<>();
        List<Long> revenue = new ArrayList<>();
        List<Integer> orders = new ArrayList<>();

        switch (type) {
            case "daily" -> {
                var results = revenueRepository.findDailyRevenue(startDate, endDate);
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
                for (Object[] row : results) {
                    labels.add(((java.sql.Date) row[0]).toLocalDate().format(formatter));
                    revenue.add(((Number) row[1]).longValue());
                    orders.add(((Number) row[2]).intValue());
                }
                return new RevenueTrendResponse(labels, revenue, orders);
            }
            case "weekly" -> {
                var results = revenueRepository.findWeeklyRevenue(startDate, endDate);
                for (Object[] row : results) {
                    labels.add("Tuần " + row[0]);
                    revenue.add(((Number) row[1]).longValue());
                }
                return new RevenueTrendResponse(labels, revenue, null);
            }
            case "monthly" -> {
                var results = revenueRepository.findMonthlyRevenue(startDate, endDate);
                for (Object[] row : results) {
                    labels.add("T" + row[1]);
                    revenue.add(((Number) row[2]).longValue());
                }
                return new RevenueTrendResponse(labels, revenue, null);
            }
            default -> throw new IllegalArgumentException("Invalid type: " + type);
        }
    }

    // By Category
    public List<RevenueByCategoryResponse> getRevenueByCategory(String range) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minus(1, toChronoUnit(range));

        var results = revenueRepository.findRevenueByCategory(start, end);
        return results.stream()
                .map(r -> new RevenueByCategoryResponse((String) r[0], ((Number) r[1]).longValue()))
                .toList();
    }

    // By brand
    public List<RevenueByBrandResponse> getRevenueByBrand(String range) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minus(1, toChronoUnit(range));

        var results = revenueRepository.findRevenueByBrand(start, end);
        return results.stream()
                .map(r -> new RevenueByBrandResponse((String) r[0], ((Number) r[1]).longValue()))
                .toList();
    }

    // By Channel
//    public List<RevenueByChannelResponse> getRevenueByChannel(LocalDateTime start, LocalDateTime end) {
//        var results = revenueRepository.findRevenueByChannel(start, end);
//        return results.stream()
//                .map(r -> new RevenueByChannelResponse((String) r[0], ((Number) r[1]).longValue()))
//                .toList();
//    }
//
//    // Compare Year
//    public List<RevenueCompareYearResponse> compareYear(int year1, int year2) {
//        var results = revenueRepository.compareRevenueByYear(year1, year2);
//        return results.stream()
//                .map(r -> new RevenueCompareYearResponse((Integer) r[0], ((Number) r[1]).longValue()))
//                .toList();
//    }

    // Summary
    public RevenueSummaryResponse getSummary(String range) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minus(1, toChronoUnit(range));

        // Kỳ hiện tại
        Object[] currentRow = (Object[]) revenueRepository.getRevenueSummary(start, end);
        Long currentRevenue = ((Number) currentRow[0]).longValue();
        Double avgOrderValue = ((Number) currentRow[1]).doubleValue();

        // Kỳ trước (cùng độ dài khoảng thời gian)
        LocalDateTime prevEnd = start;
        LocalDateTime prevStart = prevEnd.minus(1, toChronoUnit(range));

        Object[] prevRow = (Object[]) revenueRepository.getRevenueSummary(prevStart, prevEnd);
        Long previousRevenue = ((Number) prevRow[0]).longValue();

        // Tính tăng trưởng %
        double growthRate = 0.0;
        if (previousRevenue != null && previousRevenue > 0) {
            double rawRate = ((double)(currentRevenue - previousRevenue) / previousRevenue) * 100;
            growthRate = BigDecimal.valueOf(rawRate)
                    .setScale(2, RoundingMode.HALF_UP) // làm tròn 2 chữ số
                    .doubleValue();
        }

        return new RevenueSummaryResponse(
                currentRevenue,
                avgOrderValue,
                growthRate
        );
    }

    private TemporalUnit toChronoUnit(String range) {
        return switch (range.toLowerCase()) {
            case "day" -> ChronoUnit.DAYS;
            case "week" -> ChronoUnit.WEEKS;
            case "month" -> ChronoUnit.MONTHS;
            case "year" -> ChronoUnit.YEARS;
            default -> throw new IllegalArgumentException("Invalid range: " + range);
        };
    }
}
