package org.yellowcat.backend.product.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository <Payment, Integer> {
    List<Payment> findByOrder_OrderId(Integer orderId);

    Payment findByOrder(Order order);
}
