package org.yellowcat.backend.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.dto.ProductListItemDTO;
import org.yellowcat.backend.product.dto.ProductListItemManagementDTO;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    @Query(value = """
            SELECT
                p.product_id as productId,
                p.product_name as productName,
                p.description AS productDescription,
                p.material as material,
                p.target_audience as targetAudience,
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
                pv.color as color,
                pv.size as size,
                pv.price as price,
                pv.quantity_in_stock AS stockLevel,
                pv.image_url AS variantImageUrl,
                pv.weight as weight
            FROM
                Products p
            LEFT JOIN
                Categories c ON p.category_id = c.category_id
            LEFT JOIN
                Brands b ON p.brand_id = b.brand_id
            LEFT JOIN
                product_variants pv ON p.product_id = pv.product_id
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
                    "    (SELECT SUM(pv.quantity_in_stock) FROM Product_Variants pv WHERE pv.product_id = p.product_id) AS total_stock, " +
                    "    p.thumbnail " +  // Thêm dấu phẩy phía trước
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
                            "FROM Products p")
    List<ProductListItemManagementDTO> findAllProductManagement(@Param("pageSize") int pageSize, @Param("offset") int offset);
}