package org.yellowcat.backend.product.variant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface VariantAttributeRepository extends JpaRepository<VariantAttribute, Integer> {
    @Transactional
    @Modifying
    @Query("delete from VariantAttribute v where v.variant.id = ?1")
    void deleteByVariantId(Integer variantId);
}
