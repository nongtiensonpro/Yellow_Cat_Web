package org.yellowcat.backend.product.orderItem;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.orderItem.dto.OrderItemDetailProjection;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    List<OrderItem> findByOrder_OrderId(Integer orderOrderId);

    @Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.order WHERE oi.orderItemId = :id")
    OrderItem findByIdWithOrder(@Param("id") Integer id);

    Page<OrderItem> findByOrder_OrderId(Integer orderId, Pageable pageable);

    @Query(nativeQuery = true,
            value = "SELECT " +
                    "oi.order_item_id AS orderItemId, " +
                    "oi.order_id AS orderId, " +
                    "oi.quantity AS quantity, " +
                    "oi.price_at_purchase AS priceAtPurchase, " +
                    "oi.total_price AS totalPrice, " +
                    "pv.variant_id AS variantId, " +
                    "pv.sku AS sku, " +
                    "p.product_name AS productName, " +
                    "c.color_name AS colorName, " +
                    "s.size_name AS sizeName, " +
                    "m.material_name AS materialName, " +
                    "b.brand_name AS brandName, " +
                    "cat.category_name AS categoryName, " +
                    "ta.audience_name AS targetAudienceName, " +
                    "pv.price AS currentPrice, " +
                    "pv.sale_price AS salePrice, " +
                    "pv.image_url AS imageUrl, " +
                    "pv.weight AS weight, " +
                    "pv.quantity_in_stock AS quantityInStock " +
                    "FROM order_items oi " +
                    "INNER JOIN product_variants pv ON oi.variant_id = pv.variant_id " +
                    "INNER JOIN products p ON pv.product_id = p.product_id " +
                    "LEFT JOIN colors c ON pv.color_id = c.color_id " +
                    "LEFT JOIN sizes s ON pv.size_id = s.size_id " +
                    "LEFT JOIN materials m ON p.material_id = m.material_id " +
                    "LEFT JOIN brands b ON p.brand_id = b.brand_id " +
                    "LEFT JOIN categories cat ON p.category_id = cat.category_id " +
                    "LEFT JOIN target_audiences ta ON p.target_audience_id = ta.target_audience_id " +
                    "WHERE oi.order_id = :orderId " +
                    "ORDER BY oi.order_item_id")
    List<OrderItemDetailProjection> findOrderItemsDetailByOrderId(@Param("orderId") Integer orderId);

    @Query(nativeQuery = true,
            value = "SELECT " +
                    "oi.order_item_id AS orderItemId, " +
                    "oi.order_id AS orderId, " +
                    "oi.quantity AS quantity, " +
                    "oi.price_at_purchase AS priceAtPurchase, " +
                    "oi.total_price AS totalPrice, " +
                    "pv.variant_id AS variantId, " +
                    "pv.sku AS sku, " +
                    "p.product_name AS productName, " +
                    "c.color_name AS colorName, " +
                    "s.size_name AS sizeName, " +
                    "m.material_name AS materialName, " +
                    "b.brand_name AS brandName, " +
                    "cat.category_name AS categoryName, " +
                    "ta.audience_name AS targetAudienceName, " +
                    "pv.price AS currentPrice, " +
                    "pv.sale_price AS salePrice, " +
                    "pv.image_url AS imageUrl, " +
                    "pv.weight AS weight, " +
                    "pv.quantity_in_stock AS quantityInStock " +
                    "FROM order_items oi " +
                    "INNER JOIN product_variants pv ON oi.variant_id = pv.variant_id " +
                    "INNER JOIN products p ON pv.product_id = p.product_id " +
                    "LEFT JOIN colors c ON pv.color_id = c.color_id " +
                    "LEFT JOIN sizes s ON pv.size_id = s.size_id " +
                    "LEFT JOIN materials m ON p.material_id = m.material_id " +
                    "LEFT JOIN brands b ON p.brand_id = b.brand_id " +
                    "LEFT JOIN categories cat ON p.category_id = cat.category_id " +
                    "LEFT JOIN target_audiences ta ON p.target_audience_id = ta.target_audience_id " +
                    "INNER JOIN orders o ON oi.order_id = o.order_id " +
                    "WHERE o.order_code = :orderCode " +
                    "ORDER BY oi.order_item_id")
    List<OrderItemDetailProjection> findOrderItemsDetailByOrderCode(@Param("orderCode") String orderCode);
}
