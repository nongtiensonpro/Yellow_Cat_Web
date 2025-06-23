package org.yellowcat.backend.product.productvariant;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantFilterDTO;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantListResponse;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/product-variants")
@RequiredArgsConstructor
public class ProductVariantController {
    private final ProductVariantService variantService;

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
}
