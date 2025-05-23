package org.yellowcat.backend.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.dto.ProductListItemDTO;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    @Query(nativeQuery = true, value =
            "SELECT " +
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
                    "    pv.variant_id, " +
                    "    pv.sku, " +
                    "    pv.price, " +
                    "    pv.stock_level, " +
                    "    pv.image_url, " +
                    "    pv.weight, " +
                    "    " +
                    "    (SELECT STRING_AGG(CONCAT(a.attribute_name, ': ', av.value), ', ') " +
                    "     FROM Variant_Attributes va " +
                    "     JOIN Attribute_Values av ON va.attribute_value_id = av.attribute_value_id " +
                    "     JOIN Attributes a ON av.attribute_id = a.attribute_id " +
                    "     WHERE va.variant_id = pv.variant_id) AS variant_attributes, " +
                    "    " +
                    "    (SELECT STRING_AGG(CONCAT(pr.promotion_name, ' (', pr.discount_percent, '%)'), ', ') " +
                    "     FROM Product_Promotions pp " +
                    "     JOIN Promotions pr ON pp.promotion_id = pr.promotion_id " +
                    "     WHERE pp.product_id = p.product_id AND pr.is_active = TRUE " +
                    "       AND CURRENT_TIMESTAMP BETWEEN pr.start_date AND pr.end_date) AS active_promotions " +
                    "FROM " +
                    "    Products p " +
                    "LEFT JOIN " +
                    "    Categories c ON p.category_id = c.category_id " +
                    "LEFT JOIN " +
                    "    Brands b ON p.brand_id = b.brand_id " +
                    "LEFT JOIN " +
                    "    Product_Variants pv ON p.product_id = pv.product_id " +
                    "WHERE " +
                    "    p.product_id = :productId " +
                    "ORDER BY " +
                    "    pv.variant_id")
    List<Object[]> findProductDetailById(@Param("productId") Integer productId);

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
                    "    (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) AS min_price, " + // Để JPA/Hibernate tự chuyển đổi sang Double
                    "    (SELECT SUM(pv_stock.stock_level) FROM Product_Variants pv_stock WHERE pv_stock.product_id = p.product_id) AS total_stock, " + // Để JPA/Hibernate tự chuyển đổi sang Long
                    "    (SELECT pv_img.image_url FROM Product_Variants pv_img " +
                    "     WHERE pv_img.product_id = p.product_id AND pv_img.image_url IS NOT NULL " +
                    "     LIMIT 1) AS thumbnail, " +
                    "    (SELECT STRING_AGG(CONCAT(pr.promotion_name, ' (', pr.discount_percent, '%)'), ', ') " +
                    "     FROM Product_Promotions pp " +
                    "     JOIN Promotions pr ON pp.promotion_id = pr.promotion_id " +
                    "     WHERE pp.product_id = p.product_id AND pr.is_active = TRUE " +
                    "       AND CURRENT_TIMESTAMP BETWEEN pr.start_date AND pr.end_date) AS active_promotions " +
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
    List<ProductListItemDTO> findAllProductsPaginated(@Param("pageSize") int pageSize, @Param("offset") int offset);

    @Query(nativeQuery = true, value = "SELECT COUNT(DISTINCT product_id) FROM Products")
    long countTotalProducts();
}