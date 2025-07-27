package org.yellowcat.backend.product.promotionapplied;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppliedPromotionRepository extends JpaRepository<AppliedPromotion, Integer> {
    AppliedPromotion findFirstByOrderItem_OrderItemId(Integer orderItemId);
} 