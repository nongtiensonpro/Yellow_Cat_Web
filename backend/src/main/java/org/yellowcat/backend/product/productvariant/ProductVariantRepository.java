package org.yellowcat.backend.product.productvariant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.dto.ProductListItemDTO;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantDetailDTO;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantListResponse;
import org.yellowcat.backend.product.promotionproduct.dto.ProductVariantSelectionResponse;

import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer>,
        JpaSpecificationExecutor<ProductVariant> {
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

//    @Query("""
//        SELECT DISTINCT new org.yellowcat.backend.product.promotionproduct.dto.ProductVariantSelectionResponse(
//            v.variantId,
//            v.sku,
//            v.price,
//            v.salePrice,
//            v.imageUrl,
//            p.productName
//        )
//        FROM ProductVariant v
//        JOIN v.product p
//    """)
//    List<ProductVariantSelectionResponse> getAllVariantWithProductName();

    @Query("""
    SELECT new org.yellowcat.backend.product.promotionproduct.dto.ProductVariantSelectionResponse(
        v.variantId,
        v.sku,
        v.price,
        v.salePrice,
        v.imageUrl,
        p.productName
    )
    FROM ProductVariant v
    JOIN v.product p
    WHERE LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
    GROUP BY v.variantId, v.sku, v.price, v.salePrice, v.imageUrl, p.productName
""")
    Page<ProductVariantSelectionResponse> searchVariantsByKeyword(@Param("keyword") String keyword, Pageable pageable);

//    // ✅ Dùng để lấy chi tiết nhiều variant khi chọn ở UI tạo khuyến mãi
//    @Query("""
//        SELECT new org.yellowcat.backend.product.productvariant.dto.ProductVariantDetailDTO(
//            v.variantId,
//            p.productName,
//            b.brandName,
//            c.name,
//            s.name,
//            v.price,
//            v.salePrice
//        )
//        FROM ProductVariant v
//        JOIN v.product p
//        LEFT JOIN p.brand b
//        LEFT JOIN v.color c
//        LEFT JOIN v.size s
//        WHERE v.variantId IN :ids
//    """)
//    List<ProductVariantDetailDTO> findDetailsByVariantIds(@Param("ids") List<Integer> ids);


//    @Query("""
//    SELECT new org.yellowcat.backend.product.productvariant.dto.ProductVariantDetailDTO(
//        v.variantId,
//        p.productName,
//        b.brandName,
//        c.name,
//        s.name,
//        v.price,
//        v.salePrice
//    )
//    FROM ProductVariant v
//    JOIN v.product p
//    LEFT JOIN p.brand b
//    LEFT JOIN v.color c
//    LEFT JOIN v.size s
//    WHERE v.variantId IN :ids
//""")
//    List<ProductVariantDetailDTO> findDetailsByVariantIds(@Param("ids") List<Integer> ids);
//

    @Query("""
    SELECT new org.yellowcat.backend.product.productvariant.dto.ProductVariantDetailDTO(
        v.variantId,
        p.productName,
        b.brandName,
        c.name,
        s.name,
        v.price,
        v.salePrice,
        m.name
    )
    FROM ProductVariant v
    JOIN v.product p
    LEFT JOIN p.brand b
    LEFT JOIN v.color c
    LEFT JOIN v.size s
    LEFT JOIN p.material m
    WHERE v.variantId IN :ids
""")
    List<ProductVariantDetailDTO> findDetailsByVariantIds(@Param("ids") List<Integer> ids);

}
