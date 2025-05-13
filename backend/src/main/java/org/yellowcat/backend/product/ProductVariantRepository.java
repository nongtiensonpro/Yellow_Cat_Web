package org.yellowcat.backend.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer> {
     @Query("select p from ProductVariant p where p.product.id = ?1")
     List<ProductVariant> findByProductId(Integer productId);
}
