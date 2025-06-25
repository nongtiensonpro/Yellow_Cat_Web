//package org.yellowcat.backend.product.promotion;
//
//import lombok.AccessLevel;
//import lombok.RequiredArgsConstructor;
//import lombok.experimental.FieldDefaults;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Pageable;
//import org.springframework.data.web.PageableDefault;
//import org.springframework.format.annotation.DateTimeFormat;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.security.core.annotation.AuthenticationPrincipal;
//import org.springframework.security.oauth2.jwt.Jwt;
//import org.springframework.web.bind.annotation.*;
//import org.yellowcat.backend.common.config_api.response.PageResponse;
//import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
//import org.yellowcat.backend.product.promotion.dto.PromotionRequest;
//import org.yellowcat.backend.product.promotion.dto.PromotionResponse;
//
//import java.math.BigDecimal;
//import java.time.LocalDateTime;
//import java.util.Map;
//import java.util.UUID;
//
//@RestController
//@RequestMapping("/api/promotions")
//@RequiredArgsConstructor
//@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
//public class PromotionController {
//    PromotionService promotionService;
//
//    @GetMapping
//    ResponseEntity<?> getPromotions(
//            @RequestParam(defaultValue = "0") Integer page,
//            @RequestParam(defaultValue = "10") Integer size) {
//        Pageable pageable = PageRequest.of(page, size);
//        PageResponse<PromotionResponse> response = new PageResponse<>(promotionService.getAll(pageable));
//
//        return ResponseEntityBuilder.success(response);
//    }
//
//
//
//    @GetMapping("/{id}")
//    ResponseEntity<?> getPromotionById(@PathVariable Integer id) {
//        return ResponseEntityBuilder.success(promotionService.getById(id));
//    }
//
//    @PostMapping
//    @PreAuthorize("hasAnyAuthority('Admin_Web')")
//    ResponseEntity<?> createPromotion(@RequestBody PromotionRequest request,
//                                      @AuthenticationPrincipal Jwt jwt) {
//        UUID userId = UUID.fromString(jwt.getSubject());
//        PromotionResponse response = promotionService.create(request,userId);
//
//        return ResponseEntityBuilder.success(response);
//    }
//
//    @PutMapping("/{id}")
//    @PreAuthorize("hasAnyAuthority('Admin_Wed')")
//    ResponseEntity<?> updatePromotion(@PathVariable Integer id, @RequestBody PromotionRequest request) {
//        PromotionResponse response = promotionService.update(id, request);
//
//        return ResponseEntityBuilder.success(response);
//    }
//
//
//    @DeleteMapping("/{id}")
//    @PreAuthorize("hasAnyAuthority('Admin_Wed')")
//    ResponseEntity<Boolean> deletePromotion(@PathVariable Integer id) {
//        return ResponseEntity.ok(promotionService.delete(id));
//    }
//}


package org.yellowcat.backend.product.promotion;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.product.promotion.dto.PromotionRequest;
import org.yellowcat.backend.product.promotion.dto.PromotionResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PromotionController {

    PromotionService promotionService;

//    @GetMapping
//    public ResponseEntity<?> getPromotions(
//            @RequestParam(required = false) String keyword,
//            @RequestParam(required = false) String status,
//            @RequestParam(required = false) String discountType,
//            @PageableDefault(size = 5, sort = "id") Pageable pageable
//    ) {
//        Page<Promotion> result = promotionService.findWithBasicFilters(
//                keyword, status, discountType, pageable
//        );
//        return ResponseEntity.ok(Map.of("data", result));
//    }


    @GetMapping
    public ResponseEntity<?> getPromotions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String discountType,
            @PageableDefault(size = 5, sort = "id") Pageable pageable
    ) {
        Page<Promotion> result = promotionService.findWithBasicFilters(keyword, status, discountType, pageable);
        return ResponseEntity.ok(Map.of("data", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPromotionById(@PathVariable Integer id) {
        return ResponseEntityBuilder.success(promotionService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> createPromotion(
            @RequestBody PromotionRequest request,
            @AuthenticationPrincipal Jwt jwt
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
}