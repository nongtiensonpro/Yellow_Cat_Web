package org.yellowcat.backend.product.order;

import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.dto.OrderDetailProjection;
import org.yellowcat.backend.product.order.dto.OrderResponse;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    @Query(nativeQuery = true,
            value = "SELECT " +
                    "o.order_id AS orderId, " +
                    "o.order_code AS orderCode, " +
                    "o.order_date AS orderDate, " +
                    "o.order_type AS orderType, " +
                    "o.customer_name AS customerName, " +
                    "o.phone_number AS phoneNumber, " +
                    "o.final_amount AS finalAmount, " +
                    "o.order_status AS orderStatus " +
                    "FROM orders o " +
                    "WHERE o.order_code LIKE CONCAT('%', :keyword, '%') " +
                    "OR o.phone_number LIKE CONCAT('%', :keyword, '%') " +
                    "OR o.customer_name LIKE CONCAT('%', :keyword, '%') " +
                    "ORDER BY o.order_date DESC")
    Page<OrderResponse> findAllByKeyword(@Param("keyword") String keyword, Pageable pageable);


    @Query("SELECT o.orderStatus, COUNT(o) FROM Order o GROUP BY o.orderStatus")
    List<Object[]> countOrdersGroupByStatus();


    @Query("SELECT o FROM Order o WHERE o.orderId = :orderId")
    Order findByIdFetchAll(@Param("orderId") Integer orderId);

    @Query("SELECT o FROM Order o " +
            "LEFT JOIN FETCH o.payments " +
            "LEFT JOIN FETCH o.user " +
            "LEFT JOIN FETCH o.shippingAddress " +
            "LEFT JOIN FETCH o.shippingMethod " +
            "WHERE o.orderId = :orderId")
    Order findByIdWithPayments(@Param("orderId") Integer orderId);

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
                    "WHERE o.order_code = :orderCode " +
                    "ORDER BY o.order_date DESC")
    OrderResponse findOrderByOrderCodeOld(@Param("orderCode") String orderCode);

    // Query đơn giản để lấy app_user_id từ order
    @Query(nativeQuery = true,
            value = "SELECT o.app_user_id FROM orders o WHERE o.order_code = :orderCode")
    Integer findAppUserIdByOrderCode(@Param("orderCode") String orderCode);

    @Modifying
    @Transactional
    @Query(
            nativeQuery = true,
            value = "UPDATE orders " +
                    "SET " +
                    "  app_user_id   = :appUserId, " +
                    "  updated_at    = CURRENT_TIMESTAMP " +
                    "WHERE " +
                    "  order_code    = :orderCode"
    )
    int updateOrderByOrderCode(
            @Param("orderCode") String orderCode,
            @Param("appUserId") Integer appUserId
    );

    @Query(nativeQuery = true,
            value = "SELECT " +
                    "o.order_id AS orderId, " +
                    "o.order_code AS orderCode, " +
                    "o.order_date AS orderDate, " +
                    "o.order_status AS orderStatus, " +
                    "o.customer_name AS customerName, " +
                    "o.phone_number AS phoneNumber, " +
                    "o.final_amount AS finalAmount, " +
                    "o.sub_total_amount AS subTotalAmount, " +
                    "o.shipping_fee AS shippingFee, " +
                    "o.discount_amount AS discountAmount, " +
                    "sm.method_name AS shippingMethod, " +
                    "a.recipient_name AS recipientName, " +
                    "CASE WHEN a.street_address IS NOT NULL " +
                    "     THEN CONCAT(a.street_address, ', ', a.ward_commune, ', ', a.district, ', ', a.city_province) " +
                    "     ELSE NULL END AS fullAddress, " +
                    "u.email AS email, " +
                    "u.full_name AS fullName, " +
                    "o.customer_notes AS customerNotes " +
                    "FROM orders o " +
                    "LEFT JOIN app_users u ON o.app_user_id = u.app_user_id " +
                    "LEFT JOIN shipping_methods sm ON o.shipping_method_id = sm.shipping_method_id " +
                    "LEFT JOIN addresses a ON o.shipping_address_id = a.address_id " +
                    "WHERE o.phone_number LIKE CONCAT('%', :phoneNumber, '%') " +
                    "ORDER BY o.order_date DESC")
    List<OrderDetailProjection> findOrdersByPhoneNumber(@Param("phoneNumber") String phoneNumber);

    @Query(nativeQuery = true,
            value = "SELECT " +
                    "o.order_id AS orderId, " +
                    "o.order_code AS orderCode, " +
                    "o.order_date AS orderDate, " +
                    "o.order_status AS orderStatus, " +
                    "o.customer_name AS customerName, " +
                    "o.phone_number AS phoneNumber, " +
                    "o.final_amount AS finalAmount, " +
                    "o.sub_total_amount AS subTotalAmount, " +
                    "o.shipping_fee AS shippingFee, " +
                    "o.discount_amount AS discountAmount, " +
                    "sm.method_name AS shippingMethod, " +
                    "a.recipient_name AS recipientName, " +
                    "CASE WHEN a.street_address IS NOT NULL " +
                    "     THEN CONCAT(a.street_address, ', ', a.ward_commune, ', ', a.district, ', ', a.city_province) " +
                    "     ELSE NULL END AS fullAddress, " +
                    "u.email AS email, " +
                    "u.full_name AS fullName, " +
                    "o.customer_notes AS customerNotes " +
                    "FROM orders o " +
                    "LEFT JOIN app_users u ON o.app_user_id = u.app_user_id " +
                    "LEFT JOIN shipping_methods sm ON o.shipping_method_id = sm.shipping_method_id " +
                    "LEFT JOIN addresses a ON o.shipping_address_id = a.address_id " +
                    "WHERE u.email LIKE CONCAT('%', :email, '%') " +
                    "ORDER BY o.order_date DESC")
    List<OrderDetailProjection> findOrdersByEmail(@Param("email") String email);

    @Query(nativeQuery = true,
            value = "SELECT " +
                    "o.order_id AS orderId, " +
                    "o.order_code AS orderCode, " +
                    "o.order_date AS orderDate, " +
                    "o.order_status AS orderStatus, " +
                    "o.customer_name AS customerName, " +
                    "o.phone_number AS phoneNumber, " +
                    "o.final_amount AS finalAmount, " +
                    "o.sub_total_amount AS subTotalAmount, " +
                    "o.shipping_fee AS shippingFee, " +
                    "o.discount_amount AS discountAmount, " +
                    "sm.method_name AS shippingMethod, " +
                    "a.recipient_name AS recipientName, " +
                    "CASE WHEN a.street_address IS NOT NULL " +
                    "     THEN CONCAT(a.street_address, ', ', a.ward_commune, ', ', a.district, ', ', a.city_province) " +
                    "     ELSE NULL END AS fullAddress, " +
                    "u.email AS email, " +
                    "u.full_name AS fullName, " +
                    "o.customer_notes AS customerNotes " +
                    "FROM orders o " +
                    "LEFT JOIN app_users u ON o.app_user_id = u.app_user_id " +
                    "LEFT JOIN shipping_methods sm ON o.shipping_method_id = sm.shipping_method_id " +
                    "LEFT JOIN addresses a ON o.shipping_address_id = a.address_id " +
                    "WHERE (o.phone_number LIKE CONCAT('%', :searchValue, '%') OR u.email LIKE CONCAT('%', :searchValue, '%')) " +
                    "ORDER BY o.order_date DESC")
    List<OrderDetailProjection> findOrdersByPhoneNumberOrEmail(@Param("searchValue") String searchValue);

    Order getOrderByOrderCode(String orderCode);
}