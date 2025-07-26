package org.yellowcat.backend.product.promotionorder;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.order.Order;

@Repository
public interface UsedPromotionRepository extends JpaRepository<UsedPromotion, Integer> {
    Boolean existsByPromotionProgram(PromotionProgram promotionProgram);

    int countByPromotionProgram(PromotionProgram promotionProgram);

    Boolean existsByOrder(Order order);
    
    @Query("SELECT up FROM UsedPromotion up JOIN FETCH up.promotionProgram WHERE up.order = :order")
    UsedPromotion findByOrderWithPromotionProgram(@Param("order") Order order);
    

    UsedPromotion findByOrder(Order order);
}
