package org.yellowcat.backend.product.promotionproduct;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.yellowcat.backend.product.promotionproduct.dto.ProductVariantSelectionResponse;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionSummaryResponse;

import java.util.List;
import java.util.Optional;

public interface PromotionProductRepository extends JpaRepository<PromotionProduct, Integer> {
//    @Query("SELECT COUNT(p) > 0 FROM Promotion p WHERE LOWER(p.promotionName) = LOWER(:name)")
//    boolean existsByPromotionNameIgnoreCase(@Param("name") String name);

//    @Query("SELECT COUNT(p) > 0 FROM Promotion p WHERE LOWER(p.promotionName) = LOWER(:name)")
//    boolean existsByPromotionNameIgnoreCase(@Param("name") String name);
//
//    /**
//     * Kiểm tra promotionName đã tồn tại hay chưa, ngoại trừ promotion có id = :id (dùng khi update).
//     */
//    @Query("SELECT COUNT(p) > 0 FROM Promotion p WHERE LOWER(p.promotionName) = LOWER(:name) AND p.id <> :id")
//    boolean existsByPromotionNameIgnoreCaseAndIdNot(
//            @Param("name") String name,
//            @Param("id") Integer id
//    );

    @Query("SELECT COUNT(p) > 0 FROM Promotion p WHERE LOWER(TRIM(p.promotionName)) = LOWER(TRIM(:name))")
    boolean existsByPromotionNameIgnoreCase(@Param("name") String name);

    @Query("SELECT COUNT(p) > 0 FROM Promotion p WHERE LOWER(TRIM(p.promotionName)) = LOWER(TRIM(:name)) AND p.id <> :id")
    boolean existsByPromotionNameIgnoreCaseAndIdNot(
            @Param("name") String name,
            @Param("id") Integer id
    );

    


    @Query("""
                SELECT new org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse(
                    pp.promotionProductId,
                    p.promotionCode,
                    p.promotionName,
                    p.description,
                    p.discountType,
                    p.discountValue,
                    p.startDate,
                    p.endDate,
                    p.isActive,
                    v.variantId,
                    v.sku,
                    v.price,
                    v.salePrice,
                    v.imageUrl,
                    pr.productName
                )
                FROM PromotionProduct pp
                JOIN pp.promotion p
                JOIN pp.productVariant v
                JOIN v.product pr
                ORDER BY p.id DESC
            """)
    List<PromotionProductResponse> findAllWithJoin();


    @Query("""
                SELECT new org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse(
                    pp.promotionProductId,
                    p.promotionCode,
                    p.promotionName,
                    p.description,
                    p.discountType,
                    p.discountValue,
                    p.startDate,
                    p.endDate,
                    p.isActive,
                    v.variantId,
                    v.sku,
                    v.price,
                    v.salePrice,
                    v.imageUrl,
                    pr.productName
                )
                FROM PromotionProduct pp
                JOIN pp.promotion p
                JOIN pp.productVariant v
                JOIN v.product pr
                WHERE pp.promotionProductId = :id
            """)
    Optional<PromotionProductResponse> findByIdWithJoin(Integer id);


//    @Query("""
//    SELECT new org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse(
//        pp.promotionProductId,
//        p.promotionCode,
//        p.promotionName,
//        p.discountType,
//        p.discountValue,
//        p.startDate,
//        p.endDate,
//        v.variantId,
//        v.sku,
//        v.price,
//        v.salePrice,
//        v.imageUrl,
//        pr.productName
//    )
//    FROM PromotionProduct pp
//    JOIN pp.promotion p
//    JOIN pp.productVariant v
//    JOIN v.product pr
//    WHERE (:keyword IS NULL OR LOWER(p.promotionName) LIKE LOWER(CONCAT('%', :keyword, '%')))
//      AND (:status IS NULL OR
//           (:status = 'active' AND CURRENT_TIMESTAMP BETWEEN p.startDate AND p.endDate)
//           OR (:status = 'inactive' AND CURRENT_TIMESTAMP NOT BETWEEN p.startDate AND p.endDate))
//      AND (:discountType IS NULL OR p.discountType = :discountType)
//      AND (:discountValue IS NULL OR p.discountValue = :discountValue)
//""")
//    List<PromotionProductResponse> findAllWithFilters(
//            @Param("keyword") String keyword,
//            @Param("status") String status,
//            @Param("discountType") String discountType,
//            @Param("discountValue") Double discountValue
//    );

//    @Query("""
//        SELECT new org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse(
//            pp.promotionProductId,
//            p.promotionCode,
//            p.promotionName,
//            p.discountType,
//            p.discountValue,
//            p.startDate,
//            p.endDate,
//            v.variantId,
//            v.sku,
//            v.price,
//            v.salePrice,
//            v.imageUrl,
//            pr.productName
//        )
//        FROM PromotionProduct pp
//        JOIN pp.promotion p
//        JOIN pp.productVariant v
//        JOIN v.product pr
//        WHERE (:keyword IS NULL OR LOWER(p.promotionName) LIKE LOWER(CONCAT('%', :keyword, '%')))
//          AND (:status IS NULL OR
//               (:status = 'active' AND CURRENT_TIMESTAMP BETWEEN p.startDate AND p.endDate)
//               OR (:status = 'inactive' AND CURRENT_TIMESTAMP NOT BETWEEN p.startDate AND p.endDate))
//          AND (:discountType IS NULL OR p.discountType = :discountType)
//          AND (:discountValue IS NULL OR p.discountValue = :discountValue)
//        ORDER BY p.startDate DESC, p.id DESC
//    """)
//    List<PromotionProductResponse> findAllWithFilters(
//            @Param("keyword") String keyword,
//            @Param("status") String status,
//            @Param("discountType") String discountType,
//            @Param("discountValue") Double discountValue
//    );


    // Thay thế method findAllWithFilters(...) thành:
//    @Query("""
//    SELECT new org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse(
//        pp.promotionProductId,
//        p.promotionCode,
//        p.promotionName,
//        p.discountType,
//        p.discountValue,
//        p.startDate,
//        p.endDate,
//        v.variantId,
//        v.sku,
//        v.price,
//        v.salePrice,
//        v.imageUrl,
//        pr.productName
//    )
//    FROM PromotionProduct pp
//    JOIN pp.promotion p
//    JOIN pp.productVariant v
//    JOIN v.product pr
//    WHERE (:keyword IS NULL OR LOWER(p.promotionName) LIKE LOWER(CONCAT('%', :keyword, '%')))
//      AND (:status IS NULL OR
//           (:status = 'active'   AND CURRENT_TIMESTAMP BETWEEN p.startDate AND p.endDate)
//        OR (:status = 'inactive' AND CURRENT_TIMESTAMP NOT BETWEEN p.startDate AND p.endDate)
//      )
//      AND (:discountType IS NULL OR p.discountType = :discountType)
//      AND (:discountValue IS NULL OR p.discountValue = :discountValue)
//    ORDER BY p.id DESC
//""")
//    List<PromotionProductResponse> findAllWithFilters(
//            @Param("keyword") String keyword,
//            @Param("status") String status,
//            @Param("discountType") String discountType,
//            @Param("discountValue") Double discountValue
//    );

    @Query("""
            SELECT new org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse(
                pp.promotionProductId,
                p.promotionCode,
                p.promotionName,
                p.description,
                p.discountType,
                p.discountValue,
                p.startDate,
                p.endDate,
                p.isActive,
                v.variantId,
                v.sku,
                v.price,
                v.salePrice,
                v.imageUrl,
                pr.productName
            )
            FROM PromotionProduct pp
            JOIN pp.promotion p
            JOIN pp.productVariant v
            JOIN v.product pr
            WHERE (:keyword IS NULL OR LOWER(p.promotionName) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (
                :status IS NULL OR 
                (:status = 'active' AND CURRENT_TIMESTAMP BETWEEN p.startDate AND p.endDate) OR 
                (:status = 'inactive' AND CURRENT_TIMESTAMP NOT BETWEEN p.startDate AND p.endDate)
              )
              AND (:discountType IS NULL OR p.discountType = :discountType)
              AND (:discountValue IS NULL OR p.discountValue = :discountValue)
            ORDER BY p.id DESC
            """)
    List<PromotionProductResponse> findAllWithFilters(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("discountType") String discountType,
            @Param("discountValue") Double discountValue
    );


    @Query("""
                SELECT DISTINCT new org.yellowcat.backend.product.promotionproduct.dto.ProductVariantSelectionResponse(
                    v.variantId,
                    v.sku,
                    v.price,
                    v.salePrice,
                    v.imageUrl,
                    p.productName
                )
                FROM ProductVariant v
                JOIN v.product p
            """)
    List<ProductVariantSelectionResponse> findAllVariantsWithProductName();


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
            """)
    List<ProductVariantSelectionResponse> searchVariantsByKeyword(@Param("keyword") String keyword);

    @Query("""
            SELECT new org.yellowcat.backend.product.promotionproduct.dto.PromotionSummaryResponse(
                MIN(pp.promotionProductId),
                p.promotionCode,
                p.promotionName,
                p.description,
                p.discountType,
                p.discountValue,
                p.startDate,
                p.endDate,
                p.isActive
            )
            FROM PromotionProduct pp
            JOIN pp.promotion p
            GROUP BY p.promotionCode,p.promotionName, p.description, p.discountType, p.discountValue, p.startDate, p.endDate, p.isActive
            ORDER BY MIN(pp.promotionProductId) DESC
            """)
    List<PromotionSummaryResponse> findDistinctPromotions();

    @Modifying
    @Query("DELETE FROM PromotionProduct pp WHERE pp.promotion.id = :promotionId")
    void deleteByPromotionId(@Param("promotionId") Integer promotionId);

    @Query("SELECT pp.productVariant.variantId FROM PromotionProduct pp WHERE pp.promotion.id = :promotionId")
    List<Integer> findVariantIdsByPromotionId(@Param("promotionId") Integer promotionId);

    // ====== NEW: Kiểm tra xung đột khuyến mãi theo khoảng thời gian ======
    @Query("""
            SELECT v.sku
            FROM PromotionProduct pp
            JOIN pp.promotion p
            JOIN pp.productVariant v
            WHERE v.variantId IN :variantIds
              AND (:startDate <= p.endDate AND :endDate >= p.startDate)
        """)
    List<String> findConflictingSkus(
            @Param("variantIds") List<Integer> variantIds,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate
    );

    @Query("""
            SELECT v.sku
            FROM PromotionProduct pp
            JOIN pp.promotion p
            JOIN pp.productVariant v
            WHERE v.variantId IN :variantIds
              AND (:startDate <= p.endDate AND :endDate >= p.startDate)
              AND p.id <> :promotionId
        """)
    List<String> findConflictingSkusExcludingPromotion(
            @Param("variantIds") List<Integer> variantIds,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate,
            @Param("promotionId") Integer promotionId
    );

    // ====== NEW: Tìm promotion active cho variant cụ thể ======
    @Query("""
            SELECT pp
            FROM PromotionProduct pp
            JOIN pp.promotion p
            WHERE pp.productVariant.variantId = :variantId
              AND p.isActive = true
              AND :now BETWEEN p.startDate AND p.endDate
        """)
    List<PromotionProduct> findActivePromotionsByVariantId(
            @Param("variantId") Integer variantId,
            @Param("now") java.time.LocalDateTime now
    );


}


