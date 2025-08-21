package org.yellowcat.backend.statistics.profit;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.statistics.profit.dto.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalUnit;
import java.util.*;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public class ProfitService {
    ProfitRepository profitRepository;

    // 1. Summary
    public ProfitSummaryResponse getSummary(String range) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minus(1, toChronosUnit(range));

        // ---- Kỳ hiện tại ----
        double revenue = Optional.ofNullable(profitRepository.findRevenue(start, end)).orElse(0.0);
        double costOfGoods = Optional.ofNullable(profitRepository.findCostOfGoods(start, end)).orElse(0.0);
        double netProfit = revenue - costOfGoods;

        // ---- Kỳ trước ----
        LocalDateTime prevEnd = start;
        LocalDateTime prevStart = prevEnd.minus(1, toChronosUnit(range));

        double prevRevenue = Optional.ofNullable(profitRepository.findRevenue(prevStart, prevEnd)).orElse(0.0);
        double prevCostOfGoods = Optional.ofNullable(profitRepository.findCostOfGoods(prevStart, prevEnd)).orElse(0.0);
        double prevNetProfit = prevRevenue - prevCostOfGoods;

        // ---- Tính growth ----
        double revenueGrowth = (prevRevenue > 0) ? round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;
        double profitGrowth = (prevNetProfit > 0) ? round(((netProfit - prevNetProfit) / prevNetProfit) * 100) : 0;
        double growthRate = revenueGrowth;

        return ProfitSummaryResponse.builder()
                .revenue(revenue)
                .costOfGoods(costOfGoods)
                .netProfit(netProfit)
                .profitMargin(revenue > 0 ? round((netProfit / revenue) * 100) : 0)
                .growthRate(growthRate)
                .revenueGrowth(revenueGrowth)
                .profitGrowth(profitGrowth)
                .build();
    }

    // 2. Trends
    public ProfitTrendResponse getTrends(String range, String period) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minus(1, toChronosUnit(range));

        List<String> labels = new ArrayList<>();
        List<Double> revenues = new ArrayList<>();
        List<Double> netProfits = new ArrayList<>();

        switch (period) {
            case "daily" -> {
                var results = profitRepository.findDailyRevenue(start, end);
                for (Object[] row : results) {
                    // label: ngày / tuần / tháng / năm
                    labels.add(row[0].toString());

                    // revenue
                    double revenue = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
                    revenues.add(revenue);

                    // cost of goods
                    double costOfGoods = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;

                    // net profit
                    double gross = revenue - costOfGoods;
                    netProfits.add(gross);
                }
            }
            case "weekly" -> {
                var results = profitRepository.findWeeklyRevenue(start, end);
                for (Object[] row : results) {
                    labels.add("Tuần " + row[0]);

                    // revenue
                    double revenue = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
                    revenues.add(revenue);

                    // cost of goods
                    double costOfGoods = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;

                    // net profit
                    double gross = revenue - costOfGoods;
                    netProfits.add(gross);
                }
            }
            case "monthly" -> {
                var results = profitRepository.findMonthlyRevenue(start, end);
                for (Object[] row : results) {
                    labels.add("T" + row[1]);
                    // revenue
                    double revenue = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
                    revenues.add(revenue);

                    // cost of goods
                    double costOfGoods = row[3] != null ? ((Number) row[3]).doubleValue() : 0.0;

                    // net profit
                    double gross = revenue - costOfGoods;
                    netProfits.add(gross);
                }
            }
            case "yearly" -> {
                var results = profitRepository.findYearlyRevenue(start, end);
                for (Object[] row : results) {
                    labels.add(row[0].toString());
                    // revenue
                    double revenue = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
                    revenues.add(revenue);

                    // cost of goods
                    double costOfGoods = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;

                    // net profit
                    double gross = revenue - costOfGoods;
                    netProfits.add(gross);
                }
            }
            default -> throw new IllegalArgumentException("Invalid type: " + period);
        }

        Map<String, List<Double>> datasets = new HashMap<>();
        datasets.put("revenue", revenues);
        datasets.put("netProfit", netProfits);

        return ProfitTrendResponse.builder()
                .labels(labels)
                .datasets(datasets)
                .build();
    }

    // 3. Margins
    public ProfitMarginsResponse getMargins(String range, String period) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minus(1, toChronosUnit(range));

        List<String> labels = new ArrayList<>();
        List<Double> netMargins = new ArrayList<>();

        switch (period) {
            case "daily" -> {
                var results = profitRepository.findDailyRevenue(start, end);
                for (Object[] row : results) {
                    // label: ngày / tuần / tháng / năm
                    labels.add(row[0].toString());
                    // Doanh thu
                    double revenue = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
                    // Giá vốn
                    double costOfGoods = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
                    // Net Profit
                    double netProfit = revenue - costOfGoods;
                    // Margins
                    double netMargin = revenue > 0 ? round((netProfit / revenue) * 100) : 0;

                    netMargins.add(netMargin);
                }
            }
            case "weekly" -> {
                var results = profitRepository.findWeeklyRevenue(start, end);
                for (Object[] row : results) {
                    labels.add("Tuần " + row[0]);
                    // Doanh thu
                    double revenue = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
                    // Giá vốn
                    double costOfGoods = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
                    // Net Profit
                    double netProfit = revenue - costOfGoods;
                    // Margins
                    double netMargin = revenue > 0 ? round((netProfit / revenue) * 100) : 0;

                    netMargins.add(netMargin);
                }
            }
            case "monthly" -> {
                var results = profitRepository.findMonthlyRevenue(start, end);
                for (Object[] row : results) {
                    labels.add("T" + row[1]);
                    // Doanh thu
                    double revenue = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
                    // Giá vốn
                    double costOfGoods = row[3] != null ? ((Number) row[3]).doubleValue() : 0.0;
                    // Net Profit
                    double netProfit = revenue - costOfGoods;
                    // Margins
                    double netMargin = revenue > 0 ? round((netProfit / revenue) * 100) : 0;

                    netMargins.add(netMargin);
                }
            }
            case "yearly" -> {
                var results = profitRepository.findYearlyRevenue(start, end);
                for (Object[] row : results) {
                    labels.add(row[0].toString());
                    // Doanh thu
                    double revenue = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
                    // Giá vốn
                    double costOfGoods = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
                    // Net Profit
                    double netProfit = revenue - costOfGoods;
                    // Margins
                    double netMargin = revenue > 0 ? round((netProfit / revenue) * 100) : 0;

                    netMargins.add(netMargin);
                }
            }
            default -> throw new IllegalArgumentException("Invalid type: " + period);
        }

        Map<String, List<Double>> datasets = new HashMap<>();
        datasets.put("netMargin", netMargins);

        return ProfitMarginsResponse.builder()
                .labels(labels)
                .datasets(datasets)
                .build();
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

    private double round(double num) {
        return BigDecimal.valueOf(num)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
