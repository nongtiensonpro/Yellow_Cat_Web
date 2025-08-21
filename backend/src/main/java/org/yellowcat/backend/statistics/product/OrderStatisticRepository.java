package org.yellowcat.backend.statistics.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;

import java.time.LocalDateTime;

@Repository
public interface OrderStatisticRepository extends JpaRepository<Order, Integer> {
    @Query("""
                SELECT SUM(i.quantity)
                FROM Order o
                     JOIN o.orderItems i
                WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid')
                  AND o.createdAt BETWEEN :start AND :end
            """)
    Long findTotalProductsSold(@Param("start") LocalDateTime start,
                               @Param("end") LocalDateTime end);

    @Query(value = """
                SELECT SUM(oi.quantity) AS top_sold_quantity
                     FROM orders o
                            JOIN order_items oi ON o.order_id = oi.order_id
                     WHERE (o.order_status = 'Delivered' OR o.order_status = 'Paid')
                            AND o.created_at BETWEEN :start AND :end
                     GROUP BY oi.variant_id
                     ORDER BY SUM(oi.quantity) DESC
                     LIMIT 1;
            
            """, nativeQuery = true)
    Long findTopSellingProductQuantity(@Param("start") LocalDateTime start,
                                       @Param("end") LocalDateTime end);

    @Query("""
                SELECT SUM(i.quantity)
                FROM Order o
                     JOIN o.orderItems i
                WHERE o.orderStatus = 'Cancelled'
                      AND o.createdAt BETWEEN :start AND :end
            """)
    Long countReturnedProducts(@Param("start") LocalDateTime start,
                               @Param("end") LocalDateTime end);
}
