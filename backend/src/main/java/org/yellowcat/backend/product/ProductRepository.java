package org.yellowcat.backend.product;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.dto.ProductListItemDTO;
import org.yellowcat.backend.product.dto.ProductListItemManagementDTO;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    @Query(value = """
            SELECT
                p.product_id as productId,
                p.product_name as productName,
                p.description AS productDescription,
                p.material_id as materialId,
                p.target_audience_id as targetAudienceId,
                p.purchases as purchases,
                p.is_active AS isActive,
                p.category_id as categoryId,
                c.category_name as categoryName,
                p.brand_id as brandId,
                b.brand_name as brandName,
                b.brand_info as brandInfo,
                b.logo_public_id as logoPublicId,
                p.thumbnail as thumbnail,
                pv.variant_id as variantId,
                pv.sku as sku,
                pv.color_id as colorId,
                pv.size_id as sizeId,
                pv.price as price,
                pv.sale_price as salePrice,
                pv.quantity_in_stock AS stockLevel,
                pv.sold AS sold,
                pv.image_url AS variantImageUrl,
                pv.weight as weight
            FROM
                Products p
            LEFT JOIN
                Categories c ON p.category_id = c.category_id
            LEFT JOIN
                Brands b ON p.brand_id = b.brand_id
            LEFT JOIN
                materials m ON p.material_id = m.material_id
            LEFT JOIN
                target_audiences ta ON ta.target_audience_id = p.target_audience_id
            LEFT JOIN
                product_variants pv ON p.product_id = pv.product_id
            LEFT JOIN
                colors co ON pv.color_id = co.color_id
            LEFT JOIN
                sizes s ON pv.size_id = s.size_id
            WHERE
                p.product_id = :productId
            ORDER BY
                pv.variant_id
            """, nativeQuery = true)
    List<Object[]> findProductDetailRawByProductId(@Param("productId") Integer productId);

//    @Query(nativeQuery = true, value =
//            "SELECT " +
//                    "    p.product_id, " +
//                    "    p.product_name, " +
//                    "    p.purchases, " +
//                    "    c.category_name, " +
//                    "    b.brand_name, " +
//                    "    b.logo_public_id, " +
//                    "    (SELECT MIN(pv.price) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS min_price, " +
//                    "    (SELECT SUM(pv.quantity_in_stock) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS total_stock, " +
//                    "    (SELECT SUM(pv.quantity_in_stock_online) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS total_stock_online, " +
//                    "    p.thumbnail " +
//                    "FROM Products p " +
//                    "LEFT JOIN Categories c ON p.category_id = c.category_id " +
//                    "LEFT JOIN Brands b ON p.brand_id = b.brand_id " +
//                    "WHERE p.is_active = true " +
//                    "ORDER BY p.product_id " +
//                    "LIMIT :pageSize OFFSET :offset",
//            countQuery = "SELECT COUNT(*) FROM Products")
//    List<ProductListItemDTO> findAllProduct(@Param("pageSize") int pageSize, @Param("offset") int offset);


    @Query(nativeQuery = true, value =
            "SELECT " +
                    "    p.product_id, " +
                    "    p.product_name, " +
                    "    p.purchases, " +
                    "    c.category_name, " +
                    "    b.brand_name, " +
                    "    b.logo_public_id, " +
                    "    (SELECT MIN(pv.price) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS min_price, " +
                    "    (SELECT MIN(pv.sale_price) FROM Product_Variants pv WHERE pv.product_id = p.product_id AND pv.sale_price > 0.00 AND pv.sale_price IS NOT NULL) AS min_sale_price, " +
                    "    (SELECT SUM(pv.quantity_in_stock) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS total_stock, " +
                    "    p.thumbnail " +
                    "FROM Products p " +
                    "LEFT JOIN Categories c ON p.category_id = c.category_id " +
                    "LEFT JOIN Brands b ON p.brand_id = b.brand_id " +
                    "WHERE p.is_active = true " +
                    "ORDER BY p.product_id " +
                    "LIMIT :pageSize OFFSET :offset",
            countQuery = "SELECT COUNT(*) FROM Products")
    List<ProductListItemDTO> findAllProduct(@Param("pageSize") int pageSize, @Param("offset") int offset);

    @Query(nativeQuery = true, value =
            "SELECT DISTINCT ON (p.product_id) " +
                    "    p.product_id, " +
                    "    p.product_name, " +
                    "    p.description, " +
                    "    p.purchases, " +
                    "    p.created_at AS product_created_at, " +
                    "    p.updated_at AS product_updated_at, " +
                    "    p.is_active, " +
                    "    c.category_id, " +
                    "    c.category_name, " +
                    "    b.brand_id, " +
                    "    b.brand_name, " +
                    "    b.brand_info, " +
                    "    b.logo_public_id, " +
                    "    (SELECT MIN(pv.price) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS min_price, " +
                    "    (SELECT SUM(pv.quantity_in_stock) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS total_stock, " +
                    "    (SELECT pv.image_url " +
                    "     FROM Product_Variants pv " +
                    "     WHERE pv.product_id = p.product_id AND pv.image_url IS NOT NULL " +
                    "     ORDER BY pv.variant_id LIMIT 1) AS thumbnail " +
                    "FROM " +
                    "    Products p " +
                    "LEFT JOIN " +
                    "    Categories c ON p.category_id = c.category_id " +
                    "LEFT JOIN " +
                    "    Brands b ON p.brand_id = b.brand_id " +
                    "LEFT JOIN " +
                    "    Product_Variants pv ON p.product_id = pv.product_id " +
                    "ORDER BY " +
                    "    p.product_id " +
                    "LIMIT :pageSize OFFSET :offset",
            countQuery =
                    "SELECT COUNT(DISTINCT p.product_id) " +
                            "FROM Products p")
    List<ProductListItemManagementDTO> findAllProductManagement(@Param("pageSize") int pageSize, @Param("offset") int offset);

    @Query(nativeQuery = true, value = "SELECT COUNT(DISTINCT product_id) FROM Products")
    long countTotalProducts();

    @Transactional
    @Modifying
    @Query(nativeQuery = true, value =
            "UPDATE products " +
                    "SET is_active = NOT is_active ," +
                    "    updated_at = CURRENT_TIMESTAMP " +
                    "WHERE product_id = :productId")
    int activeornotactive(@Param("productId") Integer productId);

}