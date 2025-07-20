package org.yellowcat.backend.online_selling.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.online_selling.chat.dto.ProductVariantGemini;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantFilterDTO;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantListResponse;

import java.util.List;
@Repository
public interface ProductVariantOnlineRepository extends JpaRepository<ProductVariant, Integer> {
    @Query("""
        SELECT new org.yellowcat.backend.online_selling.chat.dto.ProductVariantGemini(
            p.productId,
            p.productName,
            p.description,
            cat.name,
            b.brandName,
            p.material.name,
            p.targetAudience.name,
            c.name,
            s.name,
            pv.price,
            pv.salePrice,
            pv.quantityInStock,
            pv.sold,
            pv.imageUrl,
            pv.weight
        )
        FROM ProductVariant pv
        JOIN pv.product p
        JOIN p.category cat
        JOIN p.brand b
        JOIN pv.color c
        JOIN pv.size s
        WHERE p.isActive = true
    """)
    List<ProductVariantGemini> findAllForGemini(); // ✅ Đổi tên không trùng `findAll()`
}
