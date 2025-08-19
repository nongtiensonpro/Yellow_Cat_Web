package org.yellowcat.backend.statistics.overview;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface OverViewRepository extends JpaRepository<Order, Integer> {
    // Tổng doanh thu trong khoảng thời gian
    @Query(value = """
        SELECT 
            COALESCE(SUM(o.final_amount), 0) AS total_revenue
        FROM orders o
        WHERE (o.order_status = 'Delivered' OR o.order_status = 'Paid')
          AND o.created_at BETWEEN :start AND :end
        """, nativeQuery = true)
    BigDecimal getTotalRevenue(@Param("start") LocalDateTime start,
                               @Param("end") LocalDateTime end);

    // Tổng số đơn hàng
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :start AND :end")
    Long getTotalOrders(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Số khách hàng mới
    @Query("SELECT COUNT(u) FROM AppUser u WHERE u.createdAt BETWEEN :start AND :end")
    Long getNewCustomers(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Lợi nhuận ròng (ví dụ: doanh thu - chi phí)
    @Query("""
            SELECT COALESCE(SUM(oi.totalPrice), 0) -
                   COALESCE(SUM(oi.quantity * pv.costPrice), 0)
            FROM OrderItem oi
            JOIN oi.order o
            JOIN oi.variant pv
            WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid')
              AND o.createdAt BETWEEN :start AND :end
            """)
    BigDecimal getNetProfitBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // Số đơn hàng đã giao
    @Query("SELECT COUNT(o) FROM Order o WHERE (o.orderStatus = 'Delivered' OR o.orderStatus = 'Paid') AND o.createdAt BETWEEN :start AND :end")
    Long getDeliveredOrders(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Số đơn hàng bị hủy
    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus = 'Cancelled' AND o.createdAt BETWEEN :start AND :end")
    Long getCancelledOrders(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}