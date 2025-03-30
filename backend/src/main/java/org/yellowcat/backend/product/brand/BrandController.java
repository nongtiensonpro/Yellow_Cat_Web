package org.yellowcat.backend.product.brand;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.yellowcat.backend.response.PageResponse;
import org.yellowcat.backend.response.ResponseEntityBuilder;

@RestController
@RequestMapping("/api/brands")
public class BrandController {

    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả các Brands có trong cửa hàng", description = "Trả về danh sách Brands")
    public ResponseEntity<?> getAllBrands(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BrandDTO> brands = brandService.getAllBrands(pageable);
        PageResponse<BrandDTO> pageResponse = new PageResponse<>(brands);
        return ResponseEntityBuilder.success(pageResponse);
    }
}