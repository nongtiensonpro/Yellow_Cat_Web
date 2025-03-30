package org.yellowcat.backend.product.brand;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BrandRepository extends JpaRepository<Brand, Integer> {
    @Query("SELECT b FROM Brand b LEFT JOIN FETCH b.products")
    Page<Brand> findAllWithProducts(Pageable pageable);
}