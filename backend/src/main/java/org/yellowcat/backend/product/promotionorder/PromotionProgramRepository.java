package org.yellowcat.backend.product.promotionorder;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionProgramRepository extends JpaRepository<PromotionProgram,Integer> {
    List<PromotionProgram> findByIsActiveTrue();
}
