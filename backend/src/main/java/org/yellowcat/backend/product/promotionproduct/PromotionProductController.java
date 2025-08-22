package org.yellowcat.backend.product.promotionproduct;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.promotion.dto.CreatePromotionDTO;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionEditResponse;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionSummaryResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/promotion-products")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PromotionProductController {

    PromotionProductService promotionProductService;
    PromotionProductRepository promotionProductRepository;

//    @GetMapping
//    public ResponseEntity<List<PromotionProductResponse>> getAllOrFiltered(
//            @RequestParam(required = false) String keyword,
//            @RequestParam(required = false) String status,
//            @RequestParam(required = false) String discountType,
//            @RequestParam(required = false) Double discountValue
//    ) {
//        if (keyword != null || status != null || discountType != null || discountValue != null) {
//            return ResponseEntity.ok(promotionProductService.getFiltered(keyword, status, discountType, discountValue));
//        } else {
//            return ResponseEntity.ok(promotionProductService.getAllWithJoin());
//        }
//    }

    @GetMapping
    public ResponseEntity<List<PromotionProductResponse>> getAllOrFiltered(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String discountType,
            @RequestParam(required = false) Double discountValue,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDateFilter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDateFilter
    ) {
        if (keyword != null || status != null || discountType != null || discountValue != null || startDateFilter != null || endDateFilter != null) {
            return ResponseEntity.ok(promotionProductService.getFiltered(keyword, status, discountType, discountValue, startDateFilter, endDateFilter));
        } else {
            return ResponseEntity.ok(promotionProductService.getAllWithJoin());
        }
    }

    @GetMapping("/summaries")
    public ResponseEntity<List<PromotionSummaryResponse>> getPromotionSummaries() {
        return ResponseEntity.ok(promotionProductService.getPromotionSummaries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPromotionProductById(@PathVariable Integer id) {
        try {
            PromotionProductResponse response = promotionProductService.getById(id);
            return ResponseEntityBuilder.success(response);
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Không tìm thấy đợt giảm giá với ID: " + id, e.getMessage());
        }
    }

    @GetMapping("/{id}/edit")
    public ResponseEntity<?> getPromotionForEdit(@PathVariable Integer id) {
        try {
            PromotionEditResponse response = promotionProductService.getPromotionForEdit(id);
            return ResponseEntityBuilder.success(response);
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Không tìm thấy đợt giảm giá với ID: " + id, e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePromotion(
            @PathVariable Integer id,
            @Valid @RequestBody CreatePromotionDTO dto,
            @AuthenticationPrincipal Jwt jwt
    ) {
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            promotionProductService.updatePromotionWithProducts(id, dto, userId);
            return ResponseEntityBuilder.success("Cập nhật đợt giảm giá thành công!");
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, " " + e.getMessage(), e.getMessage());
        }
    }


    @PostMapping
    public ResponseEntity<?> createPromotion(
            @Valid @RequestBody CreatePromotionDTO dto,
            @AuthenticationPrincipal Jwt jwt
    ) {
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            promotionProductService.createPromotionWithProducts(dto, userId);
            return ResponseEntityBuilder.success("Tạo đợt giảm giá thành công!");
        } catch (IllegalArgumentException e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, e.getMessage(), e.getMessage());
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST,"Lỗi khi tạo đợt giảm giá: " + e.getMessage(),"Lỗi khi tạo đợt giảm giá: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Integer id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            promotionProductService.delete(id, userId);
            return ResponseEntityBuilder.success("Xóa đợt giảm giá thành công!");
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "Lỗi khi xóa đợt giảm giá: " + e.getMessage(), e.getMessage());
        }
    }

//    @GetMapping("/check-name")
//    public ResponseEntity<Boolean> checkPromotionName(
//            @RequestParam String name,
//            @RequestParam(required = false) Integer excludeId
//    ) {
//        boolean exists;
//        if (excludeId == null) {
//            exists = promotionProductRepository.existsByPromotionNameIgnoreCase(name);
//        } else {
//            exists = promotionProductRepository
//                    .existsByPromotionNameIgnoreCaseAndIdNot(name, excludeId);
//        }
//        return ResponseEntity.ok(exists);
//    }


    @GetMapping("/check-name")
    public ResponseEntity<Boolean> checkPromotionName(
            @RequestParam String name,
            @RequestParam(required = false) Integer excludeId
    ) {
        String normalized = name == null
                ? ""
                : name.trim().replaceAll("\\s{2,}", " ");
        boolean exists = (excludeId == null)
                ? promotionProductRepository.existsByPromotionNameIgnoreCase(normalized)
                : promotionProductRepository.existsByPromotionNameIgnoreCaseAndIdNot(normalized, excludeId);
        return ResponseEntity.ok(exists);
    }



}
