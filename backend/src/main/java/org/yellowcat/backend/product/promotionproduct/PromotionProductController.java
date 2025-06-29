// Controller: PromotionProductController.java
package org.yellowcat.backend.product.promotionproduct;

import jakarta.persistence.EntityNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.product.promotion.dto.CreatePromotionDTO;
import org.yellowcat.backend.product.promotionproduct.dto.ProductVariantSelectionResponse;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionProductRequest;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/promotion-products")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PromotionProductController {

    PromotionProductService promotionProductService;

    @GetMapping
    public ResponseEntity<List<PromotionProductResponse>> getAllOrFiltered(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Double discountValue
    ) {
        if (keyword != null || status != null || discountValue != null) {
            return ResponseEntity.ok(promotionProductService.getFiltered(keyword, status, discountValue));
        } else {
            return ResponseEntity.ok(promotionProductService.getAllWithJoin());
        }
    }

//    @PostMapping
//    public ResponseEntity<PromotionProductResponse> create(@RequestBody PromotionProductRequest request) {
//        return ResponseEntity.ok(promotionProductService.create(request));
//    }

    @PostMapping  // ✅ KHÔNG thêm "/promotion-products" nữa!
    public ResponseEntity<Void> createPromotion(
            @RequestBody CreatePromotionDTO dto,
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        promotionProductService.createPromotionWithProducts(dto, userId);
        return ResponseEntity.ok().build();
    }




    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        promotionProductService.delete(id);
        return ResponseEntity.noContent().build();
    }



}
