package org.yellowcat.backend.product.promotion;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Integer>, JpaSpecificationExecutor<Promotion> {
    boolean existsByPromotionCode(String promotionCode);
    boolean existsByPromotionNameIgnoreCase(String promotionName);
    boolean existsByPromotionNameIgnoreCaseAndIdNot(String promotionName, Integer id);


    List<Promotion> findByEndDateBeforeAndIsActiveTrue(LocalDateTime now);
    @Query("""
    SELECT p FROM Promotion p
    WHERE (:keyword IS NULL OR LOWER(p.promotionCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(p.promotionName) LIKE LOWER(CONCAT('%', :keyword, '%')))
      AND (:status IS NULL OR
           (:status = 'active' AND CURRENT_TIMESTAMP < p.endDate) OR
           (:status = 'inactive' AND CURRENT_TIMESTAMP >= p.endDate))
      AND (:discountType IS NULL OR p.discountType = :discountType)
""")
    Page<Promotion> findWithFilters(@Param("keyword") String keyword,
                                    @Param("status") String status,
                                    @Param("discountType") String discountType,
                                    Pageable pageable);

}
