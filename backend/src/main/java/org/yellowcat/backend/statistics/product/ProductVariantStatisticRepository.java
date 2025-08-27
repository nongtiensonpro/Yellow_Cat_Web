package org.yellowcat.backend.statistics.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.productvariant.ProductVariant;

import java.util.List;

@Repository
public interface ProductVariantStatisticRepository extends JpaRepository<ProductVariant, Integer> {
    @Query("""
            SELECT COUNT(v)
                FROM ProductVariant v
                WHERE v.quantityInStock > 0
                  AND v.quantityInStock <= :threshold
            """)
    Long findLowStock(@Param("threshold") Integer threshold);

    @Query("""
                SELECT v
                FROM ProductVariant v
                JOIN FETCH v.product p
                JOIN FETCH v.color cl
                JOIN FETCH v.size s
                JOIN FETCH p.category c
                JOIN FETCH p.brand b
                WHERE v.quantityInStock > 0
                  AND v.quantityInStock <= :threshold
                ORDER BY v.quantityInStock ASC
            """)
    List<ProductVariant> findLowStockProducts(@Param("threshold") Integer threshold);

    @Query("""
                SELECT COUNT(v)
                FROM ProductVariant v
                WHERE v.quantityInStock = 0
            """)
    Long countOutOfStockProducts();

    @Query(value = """
            SELECT p.product_id,
                   p.product_name,
                   c.category_name,
                   b.brand_name,
                   COALESCE(SUM(s.total_sold), 0)   AS sold,
                   COALESCE(SUM(s.total_revenue), 0) AS revenue,
                   COALESCE(SUM(v.quantity_in_stock), 0) AS stock
            FROM products p
                     JOIN categories c ON p.category_id = c.category_id
                     JOIN brands b ON p.brand_id = b.brand_id
                     JOIN product_variants v ON v.product_id = p.product_id
                     LEFT JOIN (
                        SELECT oi.variant_id,
                               SUM(oi.quantity) AS total_sold,
                               SUM(oi.quantity * oi.price_at_purchase) AS total_revenue
                        FROM order_items oi
                                 JOIN orders o ON o.order_id = oi.order_id
                        WHERE o.order_status IN ('Delivered', 'Paid', 'Completed')
                        GROUP BY oi.variant_id
                     ) s ON s.variant_id = v.variant_id
            GROUP BY p.product_id, p.product_name, c.category_name, b.brand_name
            ORDER BY sold DESC
            """, nativeQuery = true)
    List<Object[]> findProductStatistics();
}
