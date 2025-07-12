package org.yellowcat.backend.online_selling.oder_online;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.user.AppUser;

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
}
