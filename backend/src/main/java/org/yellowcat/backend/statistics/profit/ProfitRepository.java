package org.yellowcat.backend.statistics.profit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProfitRepository extends JpaRepository<Order, Integer> {
    @Query("""
                SELECT SUM(o.finalAmount - o.shippingFee)
                FROM Order o
                WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
                  AND o.createdAt BETWEEN :start AND :end
            """)
    Double findRevenue(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
                SELECT SUM(v.costPrice * oi.quantity)
                FROM Order o
                JOIN o.orderItems oi
                JOIN oi.variant v
                WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
                  AND o.createdAt BETWEEN :start AND :end
            """)
    Double findCostOfGoods(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // Daily
    @Query("""
                SELECT DATE(o.createdAt),
                       SUM(DISTINCT o.finalAmount - o.shippingFee),
                       SUM(v.costPrice * i.quantity)
                FROM Order o
                     JOIN o.orderItems i
                     JOIN i.variant v
                WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
                  AND o.createdAt BETWEEN :start AND :end
                GROUP BY DATE(o.createdAt)
                ORDER BY DATE(o.createdAt)
            """)
    List<Object[]> findDailyRevenue(@Param("start") LocalDateTime start,
                                    @Param("end") LocalDateTime end);
//weekly
    @Query("""
                SELECT FUNCTION('to_char', o.createdAt, 'IYYY-IW'),
                       SUM(DISTINCT o.finalAmount - o.shippingFee),
                       SUM(v.costPrice * i.quantity)
                FROM Order o
                     JOIN o.orderItems i
                     JOIN i.variant v
                WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
                  AND o.createdAt BETWEEN :start AND :end
                GROUP BY FUNCTION('to_char', o.createdAt, 'IYYY-IW')
                ORDER BY FUNCTION('to_char', o.createdAt, 'IYYY-IW')
            """)
    List<Object[]> findWeeklyRevenue(@Param("start") LocalDateTime start,
                                     @Param("end") LocalDateTime end);


    // Monthly
    @Query("""
                SELECT YEAR(o.createdAt),
                       MONTH(o.createdAt),
                       SUM(DISTINCT o.finalAmount - o.shippingFee),
                       SUM(v.costPrice * i.quantity)
                FROM Order o
                     JOIN o.orderItems i
                     JOIN i.variant v
                WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
                  AND o.createdAt BETWEEN :start AND :end
                GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)
                ORDER BY YEAR(o.createdAt), MONTH(o.createdAt)
            """)
    List<Object[]> findMonthlyRevenue(@Param("start") LocalDateTime start,
                                      @Param("end") LocalDateTime end);



    // Yearly
    @Query("""
                SELECT YEAR(o.createdAt),
                       SUM(DISTINCT o.finalAmount- o.shippingFee),
                       SUM(v.costPrice * i.quantity)
                FROM Order o
                     JOIN o.orderItems i
                     JOIN i.variant v
                WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
                  AND o.createdAt BETWEEN :start AND :end
                GROUP BY YEAR(o.createdAt)
                ORDER BY YEAR(o.createdAt)
            """)
    List<Object[]> findYearlyRevenue(@Param("start") LocalDateTime start,
                                     @Param("end") LocalDateTime end);
}
