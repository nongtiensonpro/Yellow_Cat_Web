package org.yellowcat.backend.statistics.statisticsbyday;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RevenueDataRepository extends JpaRepository<RevenueData, LocalDate> {
    @Query(value =
            "WITH revenue_data AS ( " +
                    "  SELECT pm.payment_date::date AS revenue_date, oi.quantity, oi.total_price AS item_revenue " +
                    "  FROM orders o " +
                    "  JOIN order_items oi ON o.order_id = oi.order_id " +
                    "  JOIN payments pm ON o.order_id = pm.order_id " +
                    "  WHERE pm.payment_date::date BETWEEN :startDate AND :endDate " +
                    ") " +
                    "SELECT revenue_date AS revenueDate, " +
                    "       SUM(item_revenue) AS totalRevenue, " +
                    "       SUM(quantity) AS totalUnitsSold " +
                    "FROM revenue_data " +
                    "GROUP BY revenue_date " +
                    "ORDER BY revenue_date",
            nativeQuery = true
    )
    List<RevenueDataProjection> findRevenueDataBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}