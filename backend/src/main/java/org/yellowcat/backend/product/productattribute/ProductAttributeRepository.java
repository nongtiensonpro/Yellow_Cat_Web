package org.yellowcat.backend.product.productattribute;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, Integer> {
    @Transactional
    @Modifying
    @Query("delete from ProductAttribute p where p.product.id = ?1")
    void deleteByProductId(Integer productId);
}
