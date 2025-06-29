package org.yellowcat.backend.online_selling.oder_online;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;

@Repository
public interface OderOnlineRepository extends JpaRepository<Order, Integer> {
}
