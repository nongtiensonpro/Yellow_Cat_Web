package org.yellowcat.backend.statistics.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderAnalyticRepository extends JpaRepository<Order, Integer> {
    @Query("""
            SELECT COUNT(o)
            FROM Order o
            WHERE o.createdAt BETWEEN :start AND :end
            """)
    long countOrders(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            SELECT COUNT(o)
            FROM Order o
            WHERE (o.orderStatus = :status)
               AND o.createdAt BETWEEN :start AND :end
            """)
    long countOrdersByStatus(
            @Param("status") String status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            SELECT COALESCE(SUM(o.finalAmount),0)
            FROM Order o
            WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid')
               AND o.createdAt BETWEEN :start AND :end
            """)
    double totalRevenueBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT o.orderStatus, COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :start AND :end GROUP BY o.orderStatus")
    List<Object[]> countByStatus(LocalDateTime start, LocalDateTime end);

    @Query("""
            SELECT EXTRACT(MONTH FROM o.createdAt),
                   COUNT(o)
            FROM Order o
            WHERE EXTRACT(YEAR FROM o.createdAt) = :year
            GROUP BY EXTRACT(MONTH FROM o.createdAt)
            ORDER BY EXTRACT(MONTH FROM o.createdAt)
            """)
    List<Object[]> monthlyTrends(@Param("year") int year);

    @Query("""
            SELECT EXTRACT(MONTH FROM o.createdAt),
                   AVG(o.finalAmount)
            FROM Order o
            WHERE EXTRACT(YEAR FROM o.createdAt) = :year
                  AND (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid')
            GROUP BY EXTRACT(MONTH FROM o.createdAt)
            ORDER BY EXTRACT(MONTH FROM o.createdAt)
            """)
    List<Object[]> monthlyAOV(@Param("year") int year);

    @Query("""
            SELECT EXTRACT(MONTH FROM o.createdAt),
                   SUM(CASE WHEN o.orderStatus = 'Cancelled' THEN 1 ELSE 0 END) * 1.0 / COUNT(o) * 100
            FROM Order o
            WHERE EXTRACT(YEAR FROM o.createdAt) = :year
            GROUP BY EXTRACT(MONTH FROM o.createdAt)
            ORDER BY EXTRACT(MONTH FROM o.createdAt)
            """)
    List<Object[]> monthlyCancellationRate(@Param("year") int year);
}
