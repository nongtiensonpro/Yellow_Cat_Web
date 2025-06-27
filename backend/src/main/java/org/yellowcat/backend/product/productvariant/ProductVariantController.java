package org.yellowcat.backend.product.productvariant;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantDetailDTO;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantFilterDTO;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantHistoryDto;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantListResponse;
import org.yellowcat.backend.product.promotionproduct.dto.ProductVariantSelectionResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/product-variants")
@RequiredArgsConstructor
public class ProductVariantController {
    private final ProductVariantService variantService;

    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    @GetMapping("/history/{variantId}")
    public ResponseEntity<List<ProductVariantHistoryDto>> getHistory(
            @PathVariable int variantId
    ) {
        List<ProductVariantHistoryDto> list = variantService.getHistory(variantId);
        return ResponseEntity.ok(list);
    }

    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    @PostMapping("/rollback/{historyId}")
    public ResponseEntity<?> rollback(
            @PathVariable Integer historyId,
            @RequestBody Map<String, Integer> body
    ) {
        if (historyId == null) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "history_id is required"));
        }
        variantService.rollback(historyId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/search-paged")
    public ResponseEntity<ApiResponse<Page<ProductVariantFilterDTO>>> searchPage(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long materialId,
            @RequestParam(required = false) Long targetAudienceId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Long colorId,
            @RequestParam(required = false) Long sizeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<ProductVariantFilterDTO> results = variantService.searchPaged(
                name, categoryId, brandId, materialId,
                targetAudienceId, minPrice, maxPrice, colorId, sizeId,
                page, size
        );
        return ResponseEntityBuilder.success(results);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductVariantFilterDTO>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long materialId,
            @RequestParam(required = false) Long targetAudienceId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Long colorId,
            @RequestParam(required = false) Long sizeId
    ) {
        List<ProductVariantFilterDTO> results = variantService.search(
                name, categoryId, brandId, materialId,
                targetAudienceId, minPrice, maxPrice, colorId, sizeId
        );
        return ResponseEntity.ok(results);
    }

    @GetMapping
    @Operation(summary = "Get all product variants", description = "Returns a paginated list of product variant with detailed information")
    public ResponseEntity<?> getAllProductVariants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Page<ProductVariantListResponse> productPage = variantService.findAllProductVariant(page, size);
            return ResponseEntityBuilder.success(productPage);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Error retrieving products", "Error retrieving products");
        }
    }

//    @GetMapping("/for-selection")
//    public ResponseEntity<List<ProductVariantSelectionResponse>> getVariantsForSelection() {
//        return ResponseEntity.ok(variantService.getAllVariantsForSelection());
//    }

    @GetMapping("/for-selection")
    public ResponseEntity<ApiResponse<Page<ProductVariantSelectionResponse>>> getVariantsForSelectionPaged(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        Page<ProductVariantSelectionResponse> result =
                variantService.getAllVariantsForSelection(keyword, page, size);
        return ResponseEntityBuilder.success(result);
    }


//    @PostMapping("/details")
//    public ResponseEntity<List<ProductVariantDetailDTO>> getDetails(@RequestBody List<Integer> variantIds) {
//        List<ProductVariantDetailDTO> result = variantService.getVariantDetailsByIds(variantIds);
//        return ResponseEntity.ok(result);
//    }

//    @PostMapping("/details")
//    public ResponseEntity<?> getDetails(@RequestBody List<Integer> variantIds) {
//        try {
//            System.out.println("Received variantIds: " + variantIds);
//            List<ProductVariantDetailDTO> result = variantService.getVariantDetailsByIds(variantIds);
//            return ResponseEntity.ok(result);
//        } catch (Exception e) {
//            e.printStackTrace(); // In ra console để xem lỗi gì
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body("Lỗi xử lý chi tiết sản phẩm: " + e.getMessage());
//        }
//    }

    @PostMapping("/details")
    public ResponseEntity<?> getDetails(@RequestBody List<Integer> variantIds) {
        try {
            List<ProductVariantDetailDTO> result = variantService.getVariantDetailsByIds(variantIds);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi xử lý chi tiết sản phẩm: " + e.getMessage());
        }
    }

   
}
