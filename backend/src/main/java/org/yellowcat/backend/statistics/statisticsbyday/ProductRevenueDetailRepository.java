package org.yellowcat.backend.statistics.statisticsbyday;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ProductRevenueDetailRepository extends JpaRepository<ProductRevenueDetail, ProductRevenueDetailId> {
    @Query(value =
            "WITH revenue_data AS ( " +
                    "    SELECT " +
                    "        o.order_id, " +
                    "        pm.payment_date::date       AS revenue_date, " +
                    "        oi.variant_id, " +
                    "        pv.product_id, " +
                    "        p.product_name, " +
                    "        c.category_name, " +
                    "        b.brand_name, " +
                    "        oi.quantity, " +
                    "        oi.price_at_purchase        AS unit_price, " +
                    "        oi.total_price              AS item_revenue, " +
                    "        pm.payment_method, " +
                    "        o.order_status, " +
                    "        sm.method_name              AS shipping_method " +
                    "    FROM orders o " +
                    "             JOIN order_items oi     ON o.order_id = oi.order_id " +
                    "             JOIN product_variants pv ON oi.variant_id = pv.variant_id " +
                    "             JOIN products p          ON pv.product_id = p.product_id " +
                    "             JOIN categories c        ON p.category_id = c.category_id " +
                    "             JOIN brands b            ON p.brand_id = b.brand_id " +
                    "             LEFT JOIN payments pm    ON o.order_id = pm.order_id " +
                    "             LEFT JOIN shipping_methods sm " +
                    "                       ON o.shipping_method_id = sm.shipping_method_id " +
                    "    WHERE pm.payment_date::date BETWEEN :startDate AND :endDate " +
                    ") " +
                    "SELECT " +
                    "    revenue_date    AS orderDate, " +
                    "    product_id      AS productId, " +
                    "    product_name    AS productName, " +
                    "    variant_id      AS variantId, " +
                    "    category_name   AS categoryName, " +
                    "    brand_name      AS brandName, " +
                    "    payment_method  AS paymentMethod, " +
                    "    order_status    AS orderStatus, " +
                    "    shipping_method AS shippingMethod, " +
                    "    SUM(item_revenue)      AS totalRevenue, " +
                    "    SUM(quantity)          AS totalUnitsSold, " +
                    "    AVG(unit_price)        AS avgUnitPrice, " +
                    "    COUNT(DISTINCT order_id) AS ordersCount " +
                    "FROM revenue_data " +
                    "GROUP BY " +
                    "    revenue_date, " +
                    "    product_id, " +
                    "    product_name, " +
                    "    variant_id, " +
                    "    category_name, " +
                    "    brand_name, " +
                    "    payment_method, " +
                    "    order_status, " +
                    "    shipping_method " +
                    "ORDER BY " +
                    "    revenue_date, " +
                    "    totalRevenue DESC",
            nativeQuery = true
    )
    List<ProductRevenueDetailProjection> findProductRevenueDetailBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
} 