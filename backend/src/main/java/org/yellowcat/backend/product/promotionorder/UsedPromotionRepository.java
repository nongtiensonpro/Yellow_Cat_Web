package org.yellowcat.backend.product.promotionorder;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;

@Repository
public interface UsedPromotionRepository extends JpaRepository<UsedPromotion, Integer> {
    Boolean existsByPromotionProgram(PromotionProgram promotionProgram);

    int countByPromotionProgram(PromotionProgram promotionProgram);

    Boolean existsByOrder(Order order);
}
