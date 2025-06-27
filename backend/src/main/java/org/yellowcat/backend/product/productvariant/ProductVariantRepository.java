package org.yellowcat.backend.product.productvariant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.dto.ProductListItemDTO;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantListResponse;

import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer> {

    @Query("select p from ProductVariant p where p.product.productId = ?1")
    List<ProductVariant> findByProductId(Integer productId);

    @Query("select (count(p) > 0) from ProductVariant p where p.sku = ?1")
    Boolean existsBySku(String sku);

    @Query(nativeQuery = true, value =
            "SELECT " +
                    "    p.product_name, " +
                    "    pv.sku, " +
                    "    c.color_name, " +
                    "    s.size_name, " +
                    "    pv.price, " +
                    "    pv.sale_price, " +
                    "    pv.quantity_in_stock, " +
                    "    pv.sold, " +
                    "    pv.image_url, " +
                    "    pv.weight " +
                    "FROM product_variants pv " +
                    "LEFT JOIN products p ON pv.product_id = p.product_id " +
                    "LEFT JOIN colors c ON pv.color_id = c.color_id " +
                    "LEFT JOIN sizes s ON pv.size_id = s.size_id " +
                    "WHERE p.is_active = true " +
                    "ORDER BY p.product_id " +
                    "LIMIT :pageSize OFFSET :offset",
            countQuery = "SELECT COUNT(*) FROM product_variants")
    List<ProductVariantListResponse> findAllProductVariant(@Param("pageSize") int pageSize, @Param("offset") int offset);

    @Query(nativeQuery = true, value = "SELECT COUNT(DISTINCT variant_id) FROM product_variants")
    long countTotalProductVariants();

    // ✅ Đặt ở đây bên trong interface
    @Modifying
    @Query("UPDATE ProductVariant v SET v.quantityInStock = v.quantityInStock - :qty WHERE v.variantId = :id AND v.quantityInStock >= :qty")
    int deductStockIfEnough(@Param("id") Integer variantId, @Param("qty") int qty);
}
