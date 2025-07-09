package org.yellowcat.backend.product.promotion;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.promotion.dto.CreatePromotionDTO;
import org.yellowcat.backend.product.promotion.dto.PromotionRequest;
import org.yellowcat.backend.product.promotion.dto.PromotionResponse;
import org.yellowcat.backend.product.promotionproduct.PromotionProductService;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PromotionController {
    protected PromotionRepository promotionRepository;

    PromotionService promotionService;
    private final PromotionProductService promotionProductService;


    @GetMapping
    public ResponseEntity<?> getPromotions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String discountType,
            @PageableDefault(size = 5, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<Promotion> result = promotionService.findWithBasicFilters(keyword, status, discountType, pageable);
        return ResponseEntity.ok(Map.of("data", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPromotionById(@PathVariable Integer id) {
        try {
            PromotionResponse promotion = promotionService.getById(id);
            return ResponseEntityBuilder.success(promotion);
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST,"Không tìm thấy promotion với ID: " + id,"Không tìm thấy promotion với ID: " + id);
        }
    }



    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    ResponseEntity<?> createPromotion(
            @RequestBody PromotionRequest request,
            @AuthenticationPrincipal Jwt jwt // Thêm dòng này để lấy userId từ token
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        PromotionResponse response = promotionService.create(request, userId);

        return ResponseEntityBuilder.success(response);
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> updatePromotion(
            @PathVariable Integer id,
            @RequestBody PromotionRequest request
    ) {
        PromotionResponse response = promotionService.update(id, request);
        return ResponseEntityBuilder.success(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<Boolean> deletePromotion(@PathVariable Integer id) {
        return ResponseEntity.ok(promotionService.delete(id));
    }

    @GetMapping("/check-name")
    public ResponseEntity<?> checkName(@RequestParam String name) {
        boolean exists = promotionRepository.existsByPromotionNameIgnoreCase(name);
        return ResponseEntity.ok(Map.of("exists", exists)); // 👈 JSON hợp lệ cho FE parse
    }


}
