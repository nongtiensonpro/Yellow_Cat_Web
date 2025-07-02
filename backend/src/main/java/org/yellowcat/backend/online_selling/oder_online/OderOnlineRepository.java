package org.yellowcat.backend.online_selling.oder_online;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;

import java.util.List;

@Repository
public interface OderOnlineRepository extends JpaRepository<Order, Integer> {
    Order findByOrderCode( String odercode);
    List<Order> findByShippingAddressIsNotNullOrderByUpdatedAtDesc();
    List<Order> findByShippingAddressIsNotNullAndOrderStatusOrderByUpdatedAtDesc(String orderStatus);
    List<Order> findByOrderStatusIn(List<String> statuses);
}
