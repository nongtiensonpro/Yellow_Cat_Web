package org.yellowcat.backend.product.promotion;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.promotion.dto.CreatePromotionDTO;
import org.yellowcat.backend.product.promotion.dto.PromotionRequest;
import org.yellowcat.backend.product.promotion.dto.PromotionResponse;
import org.yellowcat.backend.product.promotionproduct.PromotionProductService;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PromotionController {
    PromotionService promotionService;
    private final PromotionProductService promotionProductService;


//    @PostMapping
//    @PreAuthorize("hasAnyAuthority('Admin_Web')")
//    public ResponseEntity<?> createPromotion(@RequestBody PromotionRequest request) {
//        PromotionResponse response = promotionService.create(request);
//        return ResponseEntityBuilder.success(response);
//    }

    // 1. Dùng cho khuyến mãi kèm danh sách sản phẩm
    @PostMapping("/with-products")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> createPromotionWithProducts(@RequestBody CreatePromotionDTO dto) {
        promotionProductService.createPromotionWithProducts(dto);
        return ResponseEntityBuilder.success("Tạo đợt khuyến mãi thành công!");
    }





    @GetMapping
    ResponseEntity<?> getPromotions(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<PromotionResponse> response = new PageResponse<>(promotionService.getAll(pageable));

        return ResponseEntityBuilder.success(response);
    }

    @GetMapping("/{id}")
    ResponseEntity<?> getPromotionById(@PathVariable Integer id) {
        return ResponseEntityBuilder.success(promotionService.getById(id));
    }

//    @PostMapping
//    @PreAuthorize("hasAnyAuthority('Admin_Web')")
//    ResponseEntity<?> createPromotion(@RequestBody PromotionRequest request) {
//        PromotionResponse response = promotionService.create(request);
//
//        return ResponseEntityBuilder.success(response);
//    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Wed')")
    ResponseEntity<?> updatePromotion(@PathVariable Integer id, @RequestBody PromotionRequest request) {
        PromotionResponse response = promotionService.update(id, request);

        return ResponseEntityBuilder.success(response);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Boolean> deletePromotion(@PathVariable Integer id) {

        return ResponseEntity.ok(promotionService.delete(id));
    }


}
