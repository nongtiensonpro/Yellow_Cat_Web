package org.yellowcat.backend.online_selling.oder_online;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.user.AppUser;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OderOnlineRepository extends JpaRepository<Order, Integer> {
    Order findByOrderCode( String odercode);
    List<Order> findByShippingAddressIsNotNullOrderByUpdatedAtDesc();
    List<Order> findByShippingAddressIsNotNullAndOrderStatusOrderByUpdatedAtDesc(String orderStatus);
    List<Order> findByOrderStatusIn(List<String> statuses);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderItems i WHERE o.orderStatus = 'WaitingForStock' AND i.variant.variantId IN :variantIds")
    List<Order> findWaitingOrdersByVariantIds(@Param("variantIds") List<Integer> variantIds);

    List<Order> findByUserOrderByOrderDateDesc(AppUser user);

    @Query(value = "SELECT o.* FROM orders o " +
            "JOIN payments p ON o.order_id = p.order_id " +
            "WHERE p.payment_method IN :paymentMethods " +
            "AND p.payment_status = :paymentStatus " +
            "AND o.order_status ILIKE :orderStatus " +
            "AND o.created_at <= :cutoffTime",
            nativeQuery = true)
    List<Order> findUnpaidOrders(
            @Param("paymentMethods") List<String> paymentMethods,
            @Param("paymentStatus") String paymentStatus,
            @Param("orderStatus") String orderStatus,
            @Param("cutoffTime") LocalDateTime cutoffTime);

}
