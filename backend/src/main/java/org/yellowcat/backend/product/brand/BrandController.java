package org.yellowcat.backend.product.brand;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.product.brand.dto.BrandCreateDto;
import org.yellowcat.backend.product.brand.dto.BrandDTO;
import org.yellowcat.backend.product.brand.dto.BrandUpdateDto;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;

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

    @GetMapping("/{id}")
    @Operation(summary = "Lấy Brand theo id", description = "Trả về Brand với id tương ứng")
    public ResponseEntity<?> getBrandById(@PathVariable Integer id) {
        BrandDTO brand = brandService.getBrandById(id);
        if (brand == null) {
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Brand không tồn tại", null);
        }
        return ResponseEntityBuilder.success(brand);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    @Operation(summary = "Thêm mới Brand", description = "Thêm mới Brand và trả về thông báo thành công nếu thành công, ngược lại trả về thông báo l��i")
    public ResponseEntity<?> addBrand(@RequestBody BrandCreateDto brandDTO) {
        System.out.println(brandDTO.toString());
        BrandDTO savedBrand = brandService.addBrand(brandDTO);
        return ResponseEntityBuilder.success("Brand đã được thêm mới thành công", savedBrand);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    @Operation(summary = "Cập nhật Brand bằng ID", description = "Cập nhật Brand theo ID được cung cấp trong đường dẫn URL")
    public ResponseEntity<?> updateBrand(
            @PathVariable Integer id,
            @RequestBody BrandUpdateDto brandDTO
    ) {
        BrandDTO updatedBrand = brandService.updateBrand(id, brandDTO);
        return ResponseEntityBuilder.success("Brand đã được cập nhật thành công", updatedBrand);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    @Operation(summary = "Xóa Brand theo id", description = "Xóa Brand và trả về thông báo thành công nếu thành công, ngược lại trả về thông báo l��i")
    public ResponseEntity<?> deleteBrand(@PathVariable Integer id) {
        boolean isDeleted = brandService.deleteBrand(id);
        if (isDeleted) {
            return ResponseEntityBuilder.success("Brand đã được xóa thành công");
        } else {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST,"Xóa Brand thất bại","Brand không tồn tại hoặc đã bị xóa rồi");
        }
    }
}