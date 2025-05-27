//package org.yellowcat.backend.product;
//
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//import org.springframework.stereotype.Repository;
//import org.yellowcat.backend.product.dto.ProductListItemDTO;
//
//import java.util.List;
//
//@Repository
//public interface ProductRepository extends JpaRepository<Product, Integer> {
//
//    @Query(nativeQuery = true, value =
//            "SELECT " +
//                    "    p.product_id, " +
//                    "    p.product_name, " +
//                    "    p.description, " +
//                    "    p.purchases, " +
//                    "    p.created_at AS product_created_at, " +
//                    "    p.updated_at AS product_updated_at, " +
//                    "    p.is_active, " +
//                    "    c.category_id, " +
//                    "    c.category_name, " +
//                    "    b.brand_id, " +
//                    "    b.brand_name, " +
//                    "    b.brand_info, " +
//                    "    b.logo_public_id, " +
//                    "    pv.variant_id, " +
//                    "    pv.sku, " +
//                    "    pv.price, " +
//                    "    pv.stock_level, " +
//                    "    pv.image_url, " +
//                    "    pv.weight, " +
//                    "    " +
//                    "    (SELECT STRING_AGG(CONCAT(a.attribute_name, ': ', av.value), ', ') " +
//                    "     FROM Variant_Attributes va " +
//                    "     JOIN Attribute_Values av ON va.attribute_value_id = av.attribute_value_id " +
//                    "     JOIN Attributes a ON av.attribute_id = a.attribute_id " +
//                    "     WHERE va.variant_id = pv.variant_id) AS variant_attributes, " +
//                    "    " +
//                    "    (SELECT STRING_AGG(CONCAT(pr.promotion_name, ' (', pr.discount_percent, '%)'), ', ') " +
//                    "     FROM Product_Promotions pp " +
//                    "     JOIN Promotions pr ON pp.promotion_id = pr.promotion_id " +
//                    "     WHERE pp.product_id = p.product_id AND pr.is_active = TRUE " +
//                    "       AND CURRENT_TIMESTAMP BETWEEN pr.start_date AND pr.end_date) AS active_promotions " +
//                    "FROM " +
//                    "    Products p " +
//                    "LEFT JOIN " +
//                    "    Categories c ON p.category_id = c.category_id " +
//                    "LEFT JOIN " +
//                    "    Brands b ON p.brand_id = b.brand_id " +
//                    "LEFT JOIN " +
//                    "    Product_Variants pv ON p.product_id = pv.product_id " +
//                    "WHERE " +
//                    "    p.product_id = :productId " +
//                    "ORDER BY " +
//                    "    pv.variant_id")
//    List<Object[]> findProductDetailById(@Param("productId") Integer productId);
//
//    @Query(nativeQuery = true, value =
//            "SELECT DISTINCT ON (p.product_id) " +
//                    "    p.product_id, " +
//                    "    p.product_name, " +
//                    "    p.description, " +
//                    "    p.purchases, " +
//                    "    p.created_at AS product_created_at, " +
//                    "    p.updated_at AS product_updated_at, " +
//                    "    p.is_active, " +
//                    "    c.category_id, " +
//                    "    c.category_name, " +
//                    "    b.brand_id, " +
//                    "    b.brand_name, " +
//                    "    b.brand_info, " +
//                    "    b.logo_public_id, " +
//                    "    (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) AS min_price, " + // Để JPA/Hibernate tự chuyển đổi sang Double
//                    "    (SELECT SUM(pv_stock.stock_level) FROM Product_Variants pv_stock WHERE pv_stock.product_id = p.product_id) AS total_stock, " + // Để JPA/Hibernate tự chuyển đổi sang Long
//                    "    (SELECT pv_img.image_url FROM Product_Variants pv_img " +
//                    "     WHERE pv_img.product_id = p.product_id AND pv_img.image_url IS NOT NULL " +
//                    "     LIMIT 1) AS thumbnail, " +
//                    "    (SELECT STRING_AGG(CONCAT(pr.promotion_name, ' (', pr.discount_percent, '%)'), ', ') " +
//                    "     FROM Product_Promotions pp " +
//                    "     JOIN Promotions pr ON pp.promotion_id = pr.promotion_id " +
//                    "     WHERE pp.product_id = p.product_id AND pr.is_active = TRUE " +
//                    "       AND CURRENT_TIMESTAMP BETWEEN pr.start_date AND pr.end_date) AS active_promotions " +
//                    "FROM " +
//                    "    Products p " +
//                    "LEFT JOIN " +
//                    "    Categories c ON p.category_id = c.category_id " +
//                    "LEFT JOIN " +
//                    "    Brands b ON p.brand_id = b.brand_id " +
//                    "LEFT JOIN " +
//                    "    Product_Variants pv ON p.product_id = pv.product_id " +
//                    "ORDER BY " +
//                    "    p.product_id " +
//                    "LIMIT :pageSize OFFSET :offset",
//            countQuery =
//                    "SELECT COUNT(DISTINCT p.product_id) " +
//                            "FROM Products p")
//    List<ProductListItemDTO> findAllProductsPaginated(@Param("pageSize") int pageSize, @Param("offset") int offset);
//
//    @Query(nativeQuery = true, value = "SELECT COUNT(DISTINCT product_id) FROM Products")
//    long countTotalProducts();
//}




package org.yellowcat.backend.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.dto.ProductListItemDTO;

import java.util.List;
import java.util.Optional; // Cần thiết để xử lý Optional cho tham số

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
                    "    (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) AS min_price, " +
                    "    (SELECT SUM(pv_stock.stock_level) FROM Product_Variants pv_stock WHERE pv_stock.product_id = p.product_id) AS total_stock, " +
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
                    // BẮT ĐẦU CÁC ĐIỀU KIỆN LỌC MỚI
                    "WHERE 1=1 " + // Mẹo để dễ dàng thêm các điều kiện AND tiếp theo
                    "    AND (:brandName IS NULL OR b.brand_name IN (:brandName)) " + // Lọc theo danh sách brandName
                    "    AND (:categoryName IS NULL OR c.category_name = :categoryName) " + // Lọc theo categoryName (radio)
                    // Lưu ý: Lọc theo Size và Price cần xem xét cẩn thận hơn vì nó liên quan đến Product_Variants
                    // Để lọc theo size, bạn cần join Product_Variants và Attribute_Values.
                    // Để lọc theo giá, bạn cần join Product_Variants và sử dụng MIN(price)
                    // Tuy nhiên, truy vấn này đã dùng DISTINCT ON (p.product_id) và tính MIN(price), SUM(stock_level).
                    // Việc lọc theo size sẽ phức tạp hơn vì một sản phẩm có thể có nhiều variants với nhiều sizes.
                    // Nếu bạn muốn lọc sản phẩm mà CÓ BẤT KỲ variant nào có size đó, bạn có thể làm như sau:
                    "    AND (:minPrice IS NULL OR " +
                    "         (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) >= :minPrice) " +
                    "    AND (:maxPrice IS NULL OR " +
                    "         (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) <= :maxPrice) " +
                    "    AND (:sizes IS NULL OR EXISTS (SELECT 1 FROM Product_Variants pv_size " +
                    "                                   JOIN Variant_Attributes va_size ON pv_size.variant_id = va_size.variant_id " +
                    "                                   JOIN Attribute_Values av_size ON va_size.attribute_value_id = av_size.attribute_value_id " +
                    "                                   JOIN Attributes a_size ON av_size.attribute_id = a_size.attribute_id " +
                    "                                   WHERE pv_size.product_id = p.product_id " +
                    "                                   AND a_size.attribute_name = 'Size' " + // Giả định tên thuộc tính là 'Size'
                    "                                   AND av_size.value IN (:sizes))) " +
                    // KẾT THÚC CÁC ĐIỀU KIỆN LỌC MỚI
                    "ORDER BY " +
                    "    p.product_id " + // Cần phải sắp xếp theo trường trong DISTINCT ON
                    "LIMIT :pageSize OFFSET :offset",
            countQuery =
                    "SELECT COUNT(DISTINCT p.product_id) " +
                            "FROM Products p " +
                            "LEFT JOIN " +
                            "    Categories c ON p.category_id = c.category_id " +
                            "LEFT JOIN " +
                            "    Brands b ON p.brand_id = b.brand_id " +
                            // Cần JOIN thêm Product_Variants và các bảng liên quan nếu điều kiện WHERE của countQuery dùng đến chúng
                            "LEFT JOIN " +
                            "    Product_Variants pv ON p.product_id = pv.product_id " +
                            "WHERE 1=1 " +
                            "    AND (:brandName IS NULL OR b.brand_name IN (:brandName)) " +
                            "    AND (:categoryName IS NULL OR c.category_name = :categoryName) " +
                            "    AND (:minPrice IS NULL OR " +
                            "         (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) >= :minPrice) " +
                            "    AND (:maxPrice IS NULL OR " +
                            "         (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) <= :maxPrice) " +
                            "    AND (:sizes IS NULL OR EXISTS (SELECT 1 FROM Product_Variants pv_size " +
                            "                                   JOIN Variant_Attributes va_size ON pv_size.variant_id = va_size.variant_id " +
                            "                                   JOIN Attribute_Values av_size ON va_size.attribute_value_id = av_size.attribute_value_id " +
                            "                                   JOIN Attributes a_size ON av_size.attribute_id = a_size.attribute_id " +
                            "                                   WHERE pv_size.product_id = p.product_id " +
                            "                                   AND a_size.attribute_name = 'Size' " +
                            "                                   AND av_size.value IN (:sizes)))")
    List<ProductListItemDTO> findAllProductsPaginated(
            @Param("pageSize") int pageSize,
            @Param("offset") int offset,
            @Param("brandName") List<String> brandNames, // Để nhận nhiều brandName
            @Param("categoryName") String categoryName,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("sizes") List<String> sizes
    );


    // Trong ProductRepository.java
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
                    "    (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) AS min_price, " +
                    "    (SELECT SUM(pv_stock.stock_level) FROM Product_Variants pv_stock WHERE pv_stock.product_id = p.product_id) AS total_stock, " +
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
                    "WHERE 1=1 " +
                    "    AND (:brandNames IS NULL OR b.brand_name IN (:brandNames)) " + // Changed to brandNames
                    "    AND (:categoryName IS NULL OR c.category_name = :categoryName) " +
                    "    AND (:minPrice IS NULL OR " +
                    "         (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) >= :minPrice) " +
                    "    AND (:maxPrice IS NULL OR " +
                    "         (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) <= :maxPrice) " +
                    "    AND (:sizes IS NULL OR EXISTS (SELECT 1 FROM Product_Variants pv_size " +
                    "                                   JOIN Variant_Attributes va_size ON pv_size.variant_id = va_size.variant_id " +
                    "                                   JOIN Attribute_Values av_size ON va_size.attribute_value_id = av_size.attribute_value_id " +
                    "                                   JOIN Attributes a_size ON av_size.attribute_id = a_size.attribute_id " +
                    "                                   WHERE pv_size.product_id = p.product_id " +
                    "                                   AND a_size.attribute_name = 'Size' " +
                    "                                   AND av_size.value IN (:sizes))) " +
                    "ORDER BY " +
                    "    p.product_id", // Order by is crucial for DISTINCT ON
            countQuery =
                    "SELECT COUNT(DISTINCT p.product_id) " +
                            "FROM Products p " +
                            "LEFT JOIN " +
                            "    Categories c ON p.category_id = c.category_id " +
                            "LEFT JOIN " +
                            "    Brands b ON p.brand_id = b.brand_id " +
                            "LEFT JOIN " +
                            "    Product_Variants pv ON p.product_id = pv.product_id " +
                            "WHERE 1=1 " +
                            "    AND (:brandNames IS NULL OR b.brand_name IN (:brandNames)) " +
                            "    AND (:categoryName IS NULL OR c.category_name = :categoryName) " +
                            "    AND (:minPrice IS NULL OR " +
                            "         (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) >= :minPrice) " +
                            "    AND (:maxPrice IS NULL OR " +
                            "         (SELECT MIN(pv_price.price) FROM Product_Variants pv_price WHERE pv_price.product_id = p.product_id) <= :maxPrice) " +
                            "    AND (:sizes IS NULL OR EXISTS (SELECT 1 FROM Product_Variants pv_size " +
                            "                                   JOIN Variant_Attributes va_size ON pv_size.variant_id = va_size.variant_id " +
                            "                                   JOIN Attribute_Values av_size ON va_size.attribute_value_id = av_size.attribute_value_id " +
                            "                                   JOIN Attributes a_size ON av_size.attribute_id = a_size.attribute_id " +
                            "                                   WHERE pv_size.product_id = p.product_id " +
                            "                                   AND a_size.attribute_name = 'Size' " +
                            "                                   AND av_size.value IN (:sizes)))")
    Page<ProductListItemDTO> findAllProductsFiltered(
            @Param("brandNames") List<String> brandNames,
            @Param("categoryName") String categoryName,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("sizes") List<String> sizes,
            Pageable pageable
    );

// Bạn có thể xóa phương thức countTotalProducts() nếu không còn dùng.
// long countTotalProducts(); // Xóa hoặc không còn cần nếu dùng Pageable
}