package org.yellowcat.backend.product.orderItem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    List<OrderItem> findByOrder_OrderId(Integer orderOrderId);

    @Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.order WHERE oi.orderItemId = :id")
    OrderItem findByIdWithOrder(@Param("id") Integer id);
}
