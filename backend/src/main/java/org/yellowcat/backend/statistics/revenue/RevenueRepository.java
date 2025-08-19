package org.yellowcat.backend.statistics.revenue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;

@Repository
public interface RevenueRepository extends JpaRepository<Order, Integer> {
}
