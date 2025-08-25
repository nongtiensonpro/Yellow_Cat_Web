package org.yellowcat.backend.statistics.overview;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.statistics.overview.dto.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalUnit;
import java.util.Optional;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class OverViewService {
    OverViewRepository overViewRepository;

    public OverviewWithChangeDTO getOverview(String range) {
        LocalDateTime now = LocalDateTime.now();

        // current period
        LocalDateTime currentEnd = now;
        LocalDateTime currentStart = currentEnd.minus(1, toChronoUnit(range));

        OverviewResponseDTO current = buildOverview(currentStart, currentEnd);

        // previous period
        LocalDateTime previousEnd = currentStart;
        LocalDateTime previousStart = previousEnd.minus(1, toChronoUnit(range));

        OverviewResponseDTO previous = buildOverview(previousStart, previousEnd);

        // build change stats
        OverviewWithChangeDTO.ChangeStats change = OverviewWithChangeDTO.ChangeStats.builder()
                .revenueChange(calcChange(current.getRevenue(), previous.getRevenue()))
                .ordersChange(calcChange(current.getOrders(), previous.getOrders()))
                .newCustomersChange(calcChange(current.getNewCustomers(), previous.getNewCustomers()))
                .completionRateChange(calcChange(current.getCompletionRate(), previous.getCompletionRate()))
                .netProfitChange(calcChange(current.getNetProfit(), previous.getNetProfit()))
                .cancelRateChange(calcChange(current.getCancelRate(), previous.getCancelRate()))
                .build();

        return OverviewWithChangeDTO.builder()
                .current(current)
                .change(change)
                .build();
    }

    private OverviewResponseDTO buildOverview(LocalDateTime startDate, LocalDateTime endDate) {
        BigDecimal revenue = Optional.ofNullable(overViewRepository.getTotalRevenue(startDate, endDate))
                .orElse(BigDecimal.ZERO);
        Long orders = overViewRepository.getTotalOrders(startDate, endDate);
        Long newCustomers = overViewRepository.getNewCustomers(startDate, endDate);
        Long orderSuccessful = overViewRepository.getDeliveredOrders(startDate, endDate);
        BigDecimal costOfGoods = Optional.ofNullable(overViewRepository.findCostOfGoods(startDate, endDate))
                .orElse(BigDecimal.ZERO);
        BigDecimal netProfit = revenue.subtract(costOfGoods);
        Long cancelledOrders = overViewRepository.getCancelledOrders(startDate, endDate);

        double completionRate = 0.0;
        double cancelRate = 0.0;

        if (orders != null && orders > 0) {
            completionRate = (orderSuccessful != null ? orderSuccessful.doubleValue() : 0.0) / orders * 100;
            cancelRate = (cancelledOrders != null ? cancelledOrders.doubleValue() : 0.0) / orders * 100;
        }

        return OverviewResponseDTO.builder()
                .revenue(revenue)
                .orders(orders != null ? orders : 0L)
                .newCustomers(newCustomers != null ? newCustomers : 0L)
                .completionRate(completionRate)
                .netProfit(netProfit)
                .cancelRate(cancelRate)
                .orderStats(
                        OverviewResponseDTO.OrderStats.builder()
                                .placed(orders != null ? orders.intValue() : 0)
                                .delivered(orderSuccessful != null ? orderSuccessful.intValue() : 0)
                                .cancelled(cancelledOrders != null ? cancelledOrders.intValue() : 0)
                                .build()
                )
                .build();
    }

    private double calcChange(Number current, Number previous) {
        if (previous == null || previous.doubleValue() == 0) {
            return current != null && current.doubleValue() > 0 ? 100.0 : 0.0;
        }
        return ((current.doubleValue() - previous.doubleValue()) / previous.doubleValue()) * 100;
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

    public Long getTotalRevenue(String range) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = switch (range.toLowerCase()) {
            case "day" -> endDate.minusDays(1);
            case "week" -> endDate.minusWeeks(1);
            case "month" -> endDate.minusMonths(1);
            case "year" -> endDate.minusYears(1);
            default -> throw new IllegalArgumentException("Invalid range: " + range);
        };

        return overViewRepository.getTotalOrders(startDate, endDate);
    }
}
