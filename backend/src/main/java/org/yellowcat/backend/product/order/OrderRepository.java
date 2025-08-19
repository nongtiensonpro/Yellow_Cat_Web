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
    @Query(nativeQuery = true, value = """
            SELECT 
              o.order_id AS orderId,
              o.order_code AS orderCode,
              o.phone_number AS phoneNumber,
              o.customer_name AS customerName,
              o.sub_total_amount AS subTotalAmount,
              o.discount_amount AS discountAmount,
              o.final_amount AS finalAmount,
              o.order_status AS orderStatus
            FROM orders o
            WHERE o.shipping_address_id IS NULL
              AND (
                   (:orderCode <> '' AND LOWER(o.order_code) LIKE LOWER(CONCAT('%', :orderCode, '%')))
                OR (:customerName <> '' AND LOWER(o.customer_name) LIKE LOWER(CONCAT('%', :customerName, '%')))
                OR (:phoneNumber <> '' AND LOWER(o.phone_number) LIKE LOWER(CONCAT('%', :phoneNumber, '%')))
                OR (:orderCode = '' AND :customerName = '' AND :phoneNumber = '')
              )
            ORDER BY o.order_date DESC
            """)
    Page<OrderResponse> searchByCodeNamePhone(
            @Param("orderCode") String orderCode,
            @Param("customerName") String customerName,
            @Param("phoneNumber") String phoneNumber,
            Pageable pageable);


    @Query(nativeQuery = true,
            value = """
                    SELECT 
                      o.order_id AS orderId,
                      o.order_code AS orderCode,
                      o.phone_number AS phoneNumber,
                      o.customer_name AS customerName,
                      o.sub_total_amount AS subTotalAmount,
                      o.discount_amount AS discountAmount,
                      o.final_amount AS finalAmount,
                      o.order_status AS orderStatus
                    FROM orders o
                    WHERE o.shipping_address_id IS NULL
                      AND (
                          LOWER(o.order_code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR LOWER(o.phone_number) LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR LOWER(o.customer_name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                      )
                    ORDER BY o.order_date DESC
                    """)
    Page<OrderResponse> findAllByKeyword(@Param("keyword") String keyword, Pageable pageable);


    @Query("SELECT o.orderStatus, COUNT(o) FROM Order o WHERE o.shippingAddress IS NULL GROUP BY o.orderStatus")
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
                    "WHERE o.shipping_address_id IS NULL " +
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
                    "AND o.shipping_address_id IS NULL " +
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
                    "AND o.shipping_address_id IS NULL " +
                    "ORDER BY o.order_date DESC")
    OrderResponse findOrderByOrderCodeOld(@Param("orderCode") String orderCode);

    // Query đơn giản để lấy app_user_id từ order tại quầy
    @Query(nativeQuery = true,
            value = "SELECT o.app_user_id FROM orders o WHERE o.order_code = :orderCode AND o.shipping_address_id IS NULL")
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
                    "  order_code    = :orderCode " +
                    "  AND shipping_address_id IS NULL"
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
                    "'Giao tại cửa hàng' AS shippingMethod, " +
                    "o.customer_name AS recipientName, " +
                    "'Nhận tại cửa hàng - Không cần giao hàng' AS fullAddress, " +
                    "u.email AS email, " +
                    "u.full_name AS fullName, " +
                    "o.customer_notes AS customerNotes " +
                    "FROM orders o " +
                    "LEFT JOIN app_users u ON o.app_user_id = u.app_user_id " +
                    "WHERE o.shipping_address_id IS NULL " +
                    "AND o.phone_number LIKE CONCAT('%', :phoneNumber, '%') " +
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
                    "'Giao tại cửa hàng' AS shippingMethod, " +
                    "o.customer_name AS recipientName, " +
                    "'Nhận tại cửa hàng - Không cần giao hàng' AS fullAddress, " +
                    "u.email AS email, " +
                    "u.full_name AS fullName, " +
                    "o.customer_notes AS customerNotes " +
                    "FROM orders o " +
                    "LEFT JOIN app_users u ON o.app_user_id = u.app_user_id " +
                    "WHERE o.shipping_address_id IS NULL " +
                    "AND u.email LIKE CONCAT('%', :email, '%') " +
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
                    "'Giao tại cửa hàng' AS shippingMethod, " +
                    "o.customer_name AS recipientName, " +
                    "'Nhận tại cửa hàng - Không cần giao hàng' AS fullAddress, " +
                    "u.email AS email, " +
                    "u.full_name AS fullName, " +
                    "o.customer_notes AS customerNotes " +
                    "FROM orders o " +
                    "LEFT JOIN app_users u ON o.app_user_id = u.app_user_id " +
                    "WHERE o.shipping_address_id IS NULL " +
                    "AND (o.phone_number LIKE CONCAT('%', :searchValue, '%') OR u.email LIKE CONCAT('%', :searchValue, '%')) " +
                    "ORDER BY o.order_date DESC")
    List<OrderDetailProjection> findOrdersByPhoneNumberOrEmail(@Param("searchValue") String searchValue);

    @Query("SELECT o FROM Order o WHERE o.orderCode = :orderCode AND o.shippingAddress IS NULL")
    Order getOrderByOrderCode(@Param("orderCode") String orderCode);
}