package org.yellowcat.backend.statistics.revenue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RevenueRepository extends JpaRepository<Order, Integer> {
    // Daily
    @Query("""
             SELECT CAST(o.createdAt AS DATE) as day,
                    SUM(o.finalAmount - o.shippingFee) as totalRevenue,
                    COUNT(o.orderId) as totalOrders
             FROM Order o
             WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
               AND o.createdAt BETWEEN :start AND :end
             GROUP BY CAST(o.createdAt AS DATE)
             ORDER BY day
            """)
    List<Object[]> findDailyRevenue(@Param("start") LocalDateTime start,
                                    @Param("end") LocalDateTime end);


    // Weekly
    @Query("""
             SELECT TO_CHAR(o.createdAt, 'IYYY-IW') as week,
                    SUM(o.finalAmount- o.shippingFee) as totalRevenue
             FROM Order o
             WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
               AND o.createdAt BETWEEN :start AND :end
             GROUP BY TO_CHAR(o.createdAt, 'IYYY-IW')
             ORDER BY week
            """)
    List<Object[]> findWeeklyRevenue(@Param("start") LocalDateTime start,
                                     @Param("end") LocalDateTime end);

    // Monthly
    @Query("""
             SELECT EXTRACT(YEAR FROM o.createdAt) as year,
                    EXTRACT(MONTH FROM o.createdAt) as month,
                    SUM(o.finalAmount - o.shippingFee) as totalRevenue
             FROM Order o
             WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
               AND o.createdAt BETWEEN :start AND :end
             GROUP BY EXTRACT(YEAR FROM o.createdAt), EXTRACT(MONTH FROM o.createdAt)
             ORDER BY year, month
            """)
    List<Object[]> findMonthlyRevenue(@Param("start") LocalDateTime start,
                                      @Param("end") LocalDateTime end);

    // By Category
    @Query("""
               SELECT c.name, SUM(i.totalPrice)
                   FROM Order o
                   JOIN o.orderItems i
                   JOIN i.variant v
                   JOIN v.product p
                   JOIN p.category c
                   WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
                     AND o.createdAt BETWEEN :start AND :end
                   GROUP BY c.name
            """)
    List<Object[]> findRevenueByCategory(@Param("start") LocalDateTime start,
                                         @Param("end") LocalDateTime end);


    // By Brand
    @Query("""
                SELECT b.brandName, SUM(i.totalPrice)
                FROM Order o
                   JOIN o.orderItems i
                   JOIN i.variant v
                   JOIN v.product p
                   JOIN p.brand b
                   WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
                     AND o.createdAt BETWEEN :start AND :end
                   GROUP BY b.brandName
            """)
    List<Object[]> findRevenueByBrand(@Param("start") LocalDateTime start,
                                      @Param("end") LocalDateTime end);

    //Summary
    @Query("""
                SELECT COALESCE(SUM(o.finalAmount - o.shippingFee), 0),
                       COALESCE(AVG(o.finalAmount - o.shippingFee), 0)
                FROM Order o
                WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid' OR o.orderStatus = 'Completed')
                  AND o.createdAt BETWEEN :start AND :end
            """)
    Object getRevenueSummary(@Param("start") LocalDateTime start,
                             @Param("end") LocalDateTime end);
}
