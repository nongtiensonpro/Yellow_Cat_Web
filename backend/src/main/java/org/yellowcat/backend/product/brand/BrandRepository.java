package org.yellowcat.backend.product.brand;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.brand.Brand;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Integer> {
    boolean existsByBrandName(String brandName);
    boolean existsByBrandNameAndBrandIdNot(String brandName, Integer brandId);
}