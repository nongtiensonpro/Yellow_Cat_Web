package org.yellowcat.backend.product;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.dto.ProductListItemDTO;
import org.yellowcat.backend.product.dto.ProductListItemManagementDTO;
import org.yellowcat.backend.product.dto.LatestProductDTO;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    List<Product> findByTargetAudienceId(Integer targetAudienceId);
    List<Product> findByMaterialId(Integer materialId);
    List<Product> findByBrandId(Integer brandId);
    List<Product> findByCategoryId(Integer categoryId);

    @Query(nativeQuery = true, value = """
            SELECT
                p.product_id,
                p.product_name,
                COALESCE(p.purchases, 0) AS purchases,
                c.category_name,
                b.brand_name,
                b.logo_public_id,
                COALESCE(CAST((SELECT MIN(pv.price) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS NUMERIC), 0.00) AS min_price,
                COALESCE(CAST((SELECT MIN(pv.sale_price) FROM Product_Variants pv WHERE pv.product_id = p.product_id AND pv.sale_price > 0.00 AND pv.sale_price IS NOT NULL) AS NUMERIC), 0.00) AS min_sale_price,
                COALESCE(CAST((SELECT SUM(pv.quantity_in_stock) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS BIGINT), 0) AS total_stock,
                p.thumbnail,
                STRING_AGG(DISTINCT s.size_name, ',') AS sizes_str,
                STRING_AGG(DISTINCT co.color_name, ',') AS colors_str
            FROM Products p
            LEFT JOIN Categories c ON p.category_id = c.category_id
            LEFT JOIN Brands b ON p.brand_id = b.brand_id
            JOIN (
                SELECT pv.product_id, COALESCE(SUM(pv.quantity_in_stock), 0) AS calculated_total_stock
                FROM Product_Variants pv
                GROUP BY pv.product_id
            ) pv_sum ON p.product_id = pv_sum.product_id
            LEFT JOIN Product_Variants pv ON p.product_id = pv.product_id
            LEFT JOIN sizes s ON pv.size_id = s.size_id
            LEFT JOIN colors co ON pv.color_id = co.color_id
            WHERE p.is_active = true AND pv_sum.calculated_total_stock <= :threshold
            GROUP BY p.product_id, c.category_id, b.brand_id, pv_sum.calculated_total_stock
            ORDER BY pv_sum.calculated_total_stock ASC
            LIMIT 10
            """)
    List<ProductListItemDTO> findLowStockProducts(@Param("threshold") int threshold);


    @Query(nativeQuery = true, value = """
            SELECT
                p.product_id,
                p.product_name,
                p.purchases,
                c.category_name,
                b.brand_name,
                b.logo_public_id,
                (SELECT MIN(pv.price) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS min_price,
                (SELECT MIN(pv.sale_price) FROM Product_Variants pv WHERE pv.product_id = p.product_id AND pv.sale_price > 0.00 AND pv.sale_price IS NOT NULL) AS min_sale_price,
                (SELECT SUM(pv.quantity_in_stock) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS total_stock,
                p.thumbnail,
                STRING_AGG(DISTINCT s.size_name, ',') AS sizes_str,
                STRING_AGG(DISTINCT co.color_name, ',') AS colors_str
            FROM Products p
            LEFT JOIN Categories c ON p.category_id = c.category_id
            LEFT JOIN Brands b ON p.brand_id = b.brand_id
            LEFT JOIN Product_Variants pv ON p.product_id = pv.product_id
            LEFT JOIN sizes s ON pv.size_id = s.size_id
            LEFT JOIN colors co ON pv.color_id = co.color_id
            WHERE p.is_active = true AND p.purchases > 0
            GROUP BY p.product_id, c.category_id, b.brand_id
            ORDER BY p.purchases DESC
            LIMIT 5
            """)
    List<ProductListItemDTO> findTop5BestSellingProducts();


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
                pv.weight as weight,
                pv.cost_price as costPrice
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
                    "    p.thumbnail, " +
                    "    STRING_AGG(DISTINCT s.size_name, ',') AS sizes_str, " +
                    "    STRING_AGG(DISTINCT co.color_name, ',') AS colors_str " +
                    "FROM Products p " +
                    "LEFT JOIN Categories c ON p.category_id = c.category_id " +
                    "LEFT JOIN Brands b ON p.brand_id = b.brand_id " +
                    "LEFT JOIN Product_Variants pv ON p.product_id = pv.product_id " +
                    "LEFT JOIN sizes s ON pv.size_id = s.size_id " +
                    "LEFT JOIN colors co ON pv.color_id = co.color_id " +
                    "WHERE (p.is_active = true AND pv.quantity_in_stock > 0)" +
                    "GROUP BY p.product_id, c.category_id, b.brand_id " +
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
                    "    (SELECT MIN(pv.cost_price) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS min_cost_price, " +
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
                    "WHERE " +
                    "    (:search IS NULL OR LOWER(p.product_name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                    "    AND (:categoryId IS NULL OR p.category_id = :categoryId) " +
                    "    AND (:brandId IS NULL OR p.brand_id = :brandId) " +
                    "ORDER BY " +
                    "    p.product_id " +
                    "LIMIT :pageSize OFFSET :offset",
            countQuery =
                    "SELECT COUNT(DISTINCT p.product_id) " +
                            "FROM Products p " +
                            "LEFT JOIN Categories c ON p.category_id = c.category_id " +
                            "LEFT JOIN Brands b ON p.brand_id = b.brand_id " +
                            "WHERE " +
                            "    (:search IS NULL OR LOWER(p.product_name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                            "    AND (:categoryId IS NULL OR p.category_id = :categoryId) " +
                            "    AND (:brandId IS NULL OR p.brand_id = :brandId)")
    List<ProductListItemManagementDTO> findAllProductManagement(
            @Param("pageSize") int pageSize, 
            @Param("offset") int offset,
            @Param("search") String search,
            @Param("categoryId") Integer categoryId,
            @Param("brandId") Integer brandId);

    @Query(nativeQuery = true, value = "SELECT COUNT(DISTINCT product_id) FROM Products")
    long countTotalProducts();

    @Query(nativeQuery = true, value = """
            SELECT COUNT(DISTINCT p.product_id) 
            FROM Products p 
            LEFT JOIN Categories c ON p.category_id = c.category_id 
            LEFT JOIN Brands b ON p.brand_id = b.brand_id 
            WHERE 
                (:search IS NULL OR LOWER(p.product_name) LIKE LOWER(CONCAT('%', :search, '%'))) 
                AND (:categoryId IS NULL OR p.category_id = :categoryId) 
                AND (:brandId IS NULL OR p.brand_id = :brandId)
            """)
    long countFilteredProducts(
            @Param("search") String search,
            @Param("categoryId") Integer categoryId,
            @Param("brandId") Integer brandId);

    @Transactional
    @Modifying
    @Query(nativeQuery = true, value =
            "UPDATE products " +
                    "SET is_active = NOT is_active ," +
                    "    updated_at = CURRENT_TIMESTAMP " +
                    "WHERE product_id = :productId")
    int activeornotactive(@Param("productId") Integer productId);

    // Thêm phương thức lấy khuyến mãi cho một variant
    @Query(value = """
            WITH base AS (
                SELECT pv.variant_id,
                       pv.price,
                       pv.sale_price
                FROM product_variants pv
                WHERE pv.variant_id = :variantId
            ),
            promo_calc AS (
                SELECT b.variant_id,
                       p.promotion_id,
                       p.promotion_code,
                       p.promotion_name,
                       p.description AS promotion_description,
                       p.discount_type,
                       p.discount_value,
                       p.start_date,
                       p.end_date,
                       p.is_active,
                       CASE
                           WHEN p.discount_type = 'percentage' THEN b.price * p.discount_value / 100
                           WHEN p.discount_type IN ('fixed_amount','VNĐ') THEN p.discount_value
                           ELSE 0
                       END AS discount_amount
                FROM base b
                JOIN promotion_products pp ON pp.variant_id = b.variant_id
                JOIN promotions p ON p.promotion_id = pp.promotion_id
                WHERE p.is_active = TRUE
                  AND p.discount_type IN ('percentage','fixed_amount','VNĐ')
                  AND NOW() BETWEEN p.start_date AND p.end_date
                  AND NOT EXISTS (
                       SELECT 1 FROM promotion_programs pg
                       WHERE pg.promotion_code = p.promotion_code
                  )
            ),
            ranked AS (
                SELECT *,
                       RANK() OVER (PARTITION BY variant_id ORDER BY discount_amount DESC) AS rnk
                FROM promo_calc
            )
            SELECT r.promotion_code,
                   r.promotion_name,
                   r.promotion_description,
                   r.discount_amount,
                   b.price - r.discount_amount AS final_price,
                   r.discount_type,
                   r.discount_value,
                   r.start_date,
                   r.end_date,
                   r.is_active,
                   (r.rnk = 1) AS is_best
            FROM ranked r
            JOIN base b ON b.variant_id = r.variant_id
            ORDER BY r.discount_amount DESC
            """, nativeQuery = true)
    List<Object[]> findVariantPromotions(@Param("variantId") Integer variantId);

    // Query tối ưu cho AI - lấy tổng quan sản phẩm
    @Query(nativeQuery = true, value = """
            SELECT 
                p.product_id,
                p.product_name,
                p.description,
                b.brand_name,
                c.category_name,
                ta.audience_name as target_audience,
                m.material_name,
                
                -- Thông tin giá
                COALESCE(MIN(pv.price), 0) as min_price,
                COALESCE(MAX(pv.price), 0) as max_price,
                COALESCE(MIN(CASE WHEN pv.sale_price > 0 THEN pv.sale_price END), 0) as min_sale_price,
                
                -- Thông tin tồn kho và bán hàng
                COALESCE(SUM(pv.quantity_in_stock), 0) as total_stock,
                COALESCE(SUM(pv.sold), 0) as total_sold,
                COALESCE(p.purchases, 0) as purchases,
                
                -- Màu sắc và kích thước có sẵn
                STRING_AGG(DISTINCT co.color_name, ', ' ORDER BY co.color_name) as available_colors,
                STRING_AGG(DISTINCT s.size_name, ', ' ORDER BY s.size_name) as available_sizes,
                
                -- Đánh giá trung bình
                COALESCE(ROUND(AVG(r.rating), 1), 0.0) as average_rating,
                COALESCE(COUNT(r.review_id), 0) as total_reviews,
                
                -- Trạng thái
                p.is_active,
                p.is_featured,
                
                -- Kiểm tra có khuyến mãi không
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM promotion_products pp 
                        JOIN promotions pr ON pr.promotion_id = pp.promotion_id 
                        WHERE pp.variant_id IN (SELECT pv2.variant_id FROM product_variants pv2 WHERE pv2.product_id = p.product_id)
                        AND pr.is_active = TRUE 
                        AND NOW() BETWEEN pr.start_date AND pr.end_date
                    ) THEN TRUE 
                    ELSE FALSE 
                END as has_promotion
                
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN target_audiences ta ON p.target_audience_id = ta.target_audience_id
            LEFT JOIN materials m ON p.material_id = m.material_id
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            LEFT JOIN colors co ON pv.color_id = co.color_id
            LEFT JOIN sizes s ON pv.size_id = s.size_id
            LEFT JOIN reviews r ON p.product_id = r.product_id
            WHERE p.is_active = TRUE
            GROUP BY p.product_id, p.product_name, p.description, b.brand_name, c.category_name, 
                     ta.audience_name, m.material_name, p.purchases, p.is_active, p.is_featured
            ORDER BY p.is_featured DESC, p.purchases DESC, p.product_id
            """)
    List<Object[]> findProductsOverviewForAI();

    // Query lấy 3 sản phẩm mới nhất với đầy đủ thông tin
    @Query(nativeQuery = true, value = """
            SELECT
                p.product_id,
                p.product_name,
                p.description,
                p.purchases,
                p.is_active,
                p.created_at,
                p.updated_at,
                p.category_id,
                c.category_name,
                p.brand_id,
                b.brand_name,
                b.brand_info,
                b.logo_public_id,
                p.material_id,
                m.material_name,
                p.target_audience_id,
                ta.audience_name as target_audience_name,
                p.thumbnail,
                COALESCE(CAST((SELECT MIN(pv.price) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS NUMERIC), 0.00) AS min_price,
                COALESCE(CAST((SELECT MIN(pv.sale_price) FROM Product_Variants pv WHERE pv.product_id = p.product_id AND pv.sale_price > 0.00 AND pv.sale_price IS NOT NULL) AS NUMERIC), 0.00) AS min_sale_price,
                COALESCE(CAST((SELECT SUM(pv.quantity_in_stock) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS BIGINT), 0) AS total_stock,
                pv.variant_id,
                pv.sku,
                co.color_name,
                s.size_name,
                pv.price,
                pv.sale_price,
                pv.quantity_in_stock,
                pv.sold,
                pv.image_url,
                pv.weight,
                pv.cost_price
            FROM Products p
            LEFT JOIN Categories c ON p.category_id = c.category_id
            LEFT JOIN Brands b ON p.brand_id = b.brand_id
            LEFT JOIN Materials m ON p.material_id = m.material_id
            LEFT JOIN Target_Audiences ta ON p.target_audience_id = ta.target_audience_id
            LEFT JOIN Product_Variants pv ON p.product_id = pv.product_id
            LEFT JOIN Colors co ON pv.color_id = co.color_id
            LEFT JOIN Sizes s ON pv.size_id = s.size_id
            WHERE p.is_active = true
            ORDER BY p.created_at DESC
            LIMIT 3
            """)
    List<Object[]> findLatest3Products();

    // Query lấy sản phẩm được đánh giá tốt nhất hoặc sản phẩm ngẫu nhiên
    @Query(nativeQuery = true, value = """
            SELECT
                p.product_id,
                p.product_name,
                p.description,
                p.purchases,
                p.is_active,
                p.created_at,
                p.updated_at,
                p.category_id,
                c.category_name,
                p.brand_id,
                b.brand_name,
                b.brand_info,
                b.logo_public_id,
                p.material_id,
                m.material_name,
                p.target_audience_id,
                ta.audience_name as target_audience_name,
                p.thumbnail,
                COALESCE(CAST((SELECT MIN(pv.price) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS NUMERIC), 0.00) AS min_price,
                COALESCE(CAST((SELECT MIN(pv.sale_price) FROM Product_Variants pv WHERE pv.product_id = p.product_id AND pv.sale_price > 0.00 AND pv.sale_price IS NOT NULL) AS NUMERIC), 0.00) AS min_sale_price,
                COALESCE(CAST((SELECT SUM(pv.quantity_in_stock) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS BIGINT), 0) AS total_stock,
                COALESCE(ROUND(AVG(r.rating), 1), 0.0) as average_rating,
                COALESCE(COUNT(r.review_id), 0) as total_reviews,
                pv.variant_id,
                pv.sku,
                co.color_name,
                s.size_name,
                pv.price,
                pv.sale_price,
                pv.quantity_in_stock,
                pv.sold,
                pv.image_url,
                pv.weight,
                pv.cost_price
            FROM Products p
            LEFT JOIN Categories c ON p.category_id = c.category_id
            LEFT JOIN Brands b ON p.brand_id = b.brand_id
            LEFT JOIN Materials m ON p.material_id = m.material_id
            LEFT JOIN Target_Audiences ta ON p.target_audience_id = ta.target_audience_id
            LEFT JOIN Product_Variants pv ON p.product_id = pv.product_id
            LEFT JOIN Colors co ON pv.color_id = co.color_id
            LEFT JOIN Sizes s ON pv.size_id = s.size_id
            LEFT JOIN Reviews r ON p.product_id = r.product_id
            WHERE p.is_active = true
            GROUP BY p.product_id, p.product_name, p.description, p.purchases, p.is_active, p.created_at, p.updated_at,
                     p.category_id, c.category_name, p.brand_id, b.brand_name, b.brand_info, b.logo_public_id,
                     p.material_id, m.material_name, p.target_audience_id, ta.audience_name, p.thumbnail,
                     pv.variant_id, pv.sku, co.color_name, s.size_name, pv.price, pv.sale_price,
                     pv.quantity_in_stock, pv.sold, pv.image_url, pv.weight, pv.cost_price
            ORDER BY 
                CASE 
                    WHEN COUNT(r.review_id) > 0 THEN AVG(r.rating) 
                    ELSE 0 
                END DESC,
                p.purchases DESC,
                RANDOM()
            LIMIT 1
            """)
    List<Object[]> findTopRatedOrRandomProduct();

}