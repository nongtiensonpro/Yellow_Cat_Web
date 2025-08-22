package org.yellowcat.backend.statistics.order;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.statistics.order.dto.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class OrderStatisticService {
    OrderAnalyticRepository orderRepository;

    public OrderSummaryDTO getSummary(String range) {
        // ---- Kỳ hiện tại ----
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minus(1, toChronosUnit(range));

        long totalOrder = orderRepository.countOrders(start, end);
        long processing = orderRepository.countOrdersByStatus("Processing", start, end);
        long shipped = orderRepository.countOrdersByStatus("Shipped", start, end);
        long delivered = orderRepository.countOrdersByStatus("Delivered", start, end);
        long paid = orderRepository.countOrdersByStatus("Paid", start, end);
        long completedOrders = delivered + paid;
        long cancelled = orderRepository.countOrdersByStatus("Cancelled", start, end);
        long returned = orderRepository.countOrdersByStatus("Returned", start, end);
        double totalRevenue = orderRepository.totalRevenueBetween(start, end);
        double avgOrderValue = (completedOrders > 0) ? round((totalRevenue / completedOrders)) : 0.0;
        double processingRate = (totalOrder > 0) ? round(((double) processing / totalOrder) * 100) : 0.0;
        double shippedRate = (totalOrder > 0) ? round(((double) shipped / totalOrder) * 100) : 0.0;
        double completionRate = (totalOrder > 0) ? round(((double) completedOrders / totalOrder) * 100) : 0.0;
        double cancellationRate = (totalOrder > 0) ? round(((double) cancelled / totalOrder) * 100) : 0.0;
        double returnRate = (totalOrder > 0) ? round(((double) returned / totalOrder) * 100) : 0.0;

        // ---- Kỳ trước ----
        LocalDateTime prevEnd = start;
        LocalDateTime prevStart = prevEnd.minus(1, toChronosUnit(range));

        long prevTotalOrder = orderRepository.countOrders(prevStart, prevEnd);
        long prevDelivered = orderRepository.countOrdersByStatus("Delivered", prevStart, prevEnd);
        long prevPaid = orderRepository.countOrdersByStatus("Paid", prevStart, prevEnd);
        long prevCompletedOrders = prevDelivered + prevPaid;
        long prevCancelled = orderRepository.countOrdersByStatus("Cancelled", prevStart, prevEnd);
        long prevReturned = orderRepository.countOrdersByStatus("Returned", prevStart, prevEnd);
        double prevTotalRevenue = orderRepository.totalRevenueBetween(prevStart, prevEnd);
        double prevAvgOrderValue = (prevCompletedOrders > 0) ? round((prevTotalRevenue / prevCompletedOrders)) : 0.0;
        double prevCompletionRate = (prevTotalOrder > 0) ? round(((double) prevCompletedOrders / prevTotalOrder) * 100) : 0.0;
        double prevCancellationRate = (prevTotalOrder > 0) ? round(((double) prevCancelled / prevTotalOrder) * 100) : 0.0;
        double prevReturnRate = (prevTotalOrder > 0) ? round(((double) prevReturned / prevTotalOrder) * 100) : 0.0;

        // ---- Tính growth ----
        double totalOrderGrowth = (prevTotalOrder > 0)
                ? round(((double) (totalOrder - prevTotalOrder) / prevTotalOrder) * 100) : 0;
        double avgOrderValueGrowth = (prevAvgOrderValue > 0)
                ? round(((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100) : 0;
        double completionRateGrowth = (prevCompletionRate > 0)
                ? round(((completionRate - prevCompletionRate) / prevCompletionRate) * 100) : 0;
        double cancellationRateGrowth = (prevCancellationRate > 0)
                ? round(((cancellationRate - prevCancellationRate) / prevCancellationRate) * 100) : 0;
        double returnRateGrowth = (prevReturnRate > 0)
                ? round(((returnRate - prevReturnRate) / prevReturnRate) * 100) : 0;

        return OrderSummaryDTO.builder()
                .totalOrder(totalOrder)
                .processing(processing)
                .shipped(shipped)
                .delivered(completedOrders)
                .cancelled(cancelled)
                .returned(returned)
                .totalRevenue(totalRevenue)
                .avgOrderValue(avgOrderValue)
                .processingRate(processingRate)
                .shippedRate(shippedRate)
                .completionRate(completionRate)
                .cancellationRate(cancellationRate)
                .returnRate(returnRate)
                .totalOrderGrowth(totalOrderGrowth)
                .avgOrderValueGrowth(avgOrderValueGrowth)
                .completionRateGrowth(completionRateGrowth)
                .cancellationRateGrowth(cancellationRateGrowth)
                .returnRateGrowth(returnRateGrowth)
                .build();
    }

        public List<MonthlyTrendDTO> getTrends(int year) {
        List<MonthlyTrendDTO> result = new ArrayList<>();
        orderRepository.monthlyTrends(year).forEach(row ->
                result.add(new MonthlyTrendDTO("T" + (row[0]), ((Long) row[1])))
        );
        return result;
    }

    public List<AovDTO> getMonthlyAOV(int year) {
        List<AovDTO> result = new ArrayList<>();
        orderRepository.monthlyAOV(year).forEach(row ->
                result.add(new AovDTO("T" + (row[0]), (Double) row[1]))
        );
        return result;
    }

    public List<CancellationRateDTO> getMonthlyCancellationRate(int year) {
        List<CancellationRateDTO> result = new ArrayList<>();
        orderRepository.monthlyCancellationRate(year).forEach(row ->
                result.add(new CancellationRateDTO("T" + (row[0]), (Double) row[1]))
        );
        return result;
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
