// Repository: PromotionProductRepository.java
package org.yellowcat.backend.product.promotionproduct;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.yellowcat.backend.product.promotionproduct.dto.ProductVariantSelectionResponse;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse;

import java.util.List;
import java.util.Optional;

public interface PromotionProductRepository extends JpaRepository<PromotionProduct, Integer> {

    @Query("""
        SELECT new org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse(
            pp.promotionProductId,
            p.promotionCode,
            p.promotionName,
            p.discountType,
            p.discountValue,
            p.startDate,
            p.endDate,
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
    """)
    List<PromotionProductResponse> findAllWithJoin();

    @Query("""
        SELECT new org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse(
            pp.promotionProductId,
            p.promotionCode,
            p.promotionName,
            p.discountType,
            p.discountValue,
            p.startDate,
            p.endDate,
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


    @Query("""
    SELECT new org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse(
        pp.promotionProductId,
        p.promotionCode,
        p.promotionName,
        p.discountType,
        p.discountValue,
        p.startDate,
        p.endDate,
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
      AND (:status IS NULL OR 
           (:status = 'active' AND CURRENT_TIMESTAMP BETWEEN p.startDate AND p.endDate)
           OR (:status = 'inactive' AND CURRENT_TIMESTAMP NOT BETWEEN p.startDate AND p.endDate))
      AND (:discountType IS NULL OR p.discountType = :discountType)
      AND (:discountValue IS NULL OR p.discountValue = :discountValue)
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

    @Modifying
    @Query("DELETE FROM PromotionProduct pp WHERE pp.promotion.id = :promotionId")
    void deleteByPromotionId(@Param("promotionId") Integer promotionId);

    @Query("SELECT pp.productVariant.variantId FROM PromotionProduct pp WHERE pp.promotion.id = :promotionId")
    List<Integer> findVariantIdsByPromotionId(@Param("promotionId") Integer promotionId);




}


