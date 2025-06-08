package org.yellowcat.backend.product.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.dto.OrderResponse;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    @Query("SELECT o FROM Order o WHERE o.orderId = :orderId")
    Order findByIdFetchAll(@Param("orderId") Integer orderId);

    @Query(nativeQuery = true,
            value = "SELECT " +
                    "o.order_id AS orderId, " +
                    "o.order_code AS orderCode, " +
                    "o.phone_number AS phoneNumber, " +
                    "o.customer_name AS customerName, " +
                    "o.sub_total_amount AS subTotalAmount, " +
                    "o.discount_amount AS discountAmount, " +
                    "o.final_amount AS finalAmount, " +
                    "o.order_status AS orderStatus " +
                    "FROM orders o " +
                    "ORDER BY o.order_date DESC"
    )
    Page<OrderResponse> findAllOrders(Pageable pageable);

    @Query(nativeQuery = true,
            value = "SELECT " +
                    "o.order_id AS orderId, " +
                    "o.order_code AS orderCode, " +
                    "o.phone_number AS phoneNumber, " +
                    "o.customer_name AS customerName, " +
                    "o.sub_total_amount AS subTotalAmount, " +
                    "o.discount_amount AS discountAmount, " +
                    "o.final_amount AS finalAmount, " +
                    "o.order_status AS orderStatus " +
                    "FROM orders o " +
                    "WHERE o.order_status = :orderStatus " +
                    "ORDER BY o.order_date DESC"
    )
    Page<OrderResponse> findAllByOrderStatus(String orderStatus, Pageable pageable);
}