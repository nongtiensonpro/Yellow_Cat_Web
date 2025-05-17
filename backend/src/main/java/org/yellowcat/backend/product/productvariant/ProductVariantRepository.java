package org.yellowcat.backend.product.productvariant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer> {
    /**
     * Retrieves all product variants associated with the specified product ID.
     *
     * @param productId the ID of the product whose variants are to be fetched
     * @return a list of product variants linked to the given product ID
     */
    @Query("select p from ProductVariant p where p.product.id = ?1")
    List<ProductVariant> findByProductId(Integer productId);

    /**
     * Checks if a product variant exists with the specified SKU.
     *
     * @param sku the SKU to search for
     * @return true if a product variant with the given SKU exists, false otherwise
     */
    @Query("select (count(p) > 0) from ProductVariant p where p.sku = ?1")
    Boolean existsBySku(String sku);
}
