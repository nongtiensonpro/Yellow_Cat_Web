package org.yellowcat.backend.product.brand;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.config.exception.ApiResponse;
import org.yellowcat.backend.product.brand.dto.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.yellowcat.backend.product.service.BrandService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user/brands")
@Validated
public class BrandController {

    private final BrandService brandService;
    private final BrandMapper brandMapper;
    private final BrandResponseMapper responseMapper;

    public BrandController(
            BrandService brandService,
            BrandMapper brandMapper,
            BrandResponseMapper responseMapper) {
        this.brandService = brandService;
        this.brandMapper = brandMapper;
        this.responseMapper = responseMapper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BrandResponseDTO>>> getAllBrands(HttpServletRequest request) {
        List<BrandDTO> brands = brandService.getAllBrands();

        String baseUrl = getBaseUrl(request);
        List<BrandResponseDTO> brandResponses = brands.stream()
                .map(dto -> convertToResponseWithLinks(dto, baseUrl))
                .collect(Collectors.toList());

        ApiResponse<List<BrandResponseDTO>> response = ApiResponse.of(
                HttpStatus.OK,
                "Lấy danh sách thương hiệu thành công",
                brandResponses
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Page<BrandResponseDTO>>> getBrandsWithPagination(
            @PageableDefault(size = 10, sort = "brandName") Pageable pageable,
            HttpServletRequest request) {

        Page<BrandDTO> brandPage = brandService.getBrandsWithPagination(pageable);
        String baseUrl = getBaseUrl(request);

        Page<BrandResponseDTO> responsePage = brandPage.map(dto ->
                convertToResponseWithLinks(dto, baseUrl));

        ApiResponse<Page<BrandResponseDTO>> response = ApiResponse.of(
                HttpStatus.OK,
                "Lấy danh sách thương hiệu phân trang thành công",
                responsePage
        );

        response.addMetadata("totalElements", brandPage.getTotalElements())
                .addMetadata("totalPages", brandPage.getTotalPages())
                .addMetadata("currentPage", brandPage.getNumber())
                .addMetadata("size", brandPage.getSize());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BrandResponseDTO>> getBrandById(
            @PathVariable Integer id,
            HttpServletRequest request) {
        BrandDTO brand = brandService.getBrandById(id);
        String baseUrl = getBaseUrl(request);
        BrandResponseDTO responseDto = convertToResponseWithLinks(brand, baseUrl);

        ApiResponse<BrandResponseDTO> response = ApiResponse.of(
                HttpStatus.OK,
                "Lấy thông tin thương hiệu thành công",
                responseDto
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<ApiResponse<BrandResponseDTO>> createBrand(
            @Valid @RequestBody CreateBrandRequest request,
            HttpServletRequest servletRequest) {
        BrandDTO createdBrand = brandService.createBrand(request);
        String baseUrl = getBaseUrl(servletRequest);
        BrandResponseDTO responseDto = convertToResponseWithLinks(createdBrand, baseUrl);

        ApiResponse<BrandResponseDTO> response = ApiResponse.of(
                HttpStatus.CREATED,
                "Tạo thương hiệu thành công",
                responseDto
        );

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<ApiResponse<BrandResponseDTO>> updateBrand(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateBrandRequest request,
            HttpServletRequest servletRequest) {

        BrandDTO updatedBrand = brandService.updateBrand(id, request);
        String baseUrl = getBaseUrl(servletRequest);
        BrandResponseDTO responseDto = convertToResponseWithLinks(updatedBrand, baseUrl);

        ApiResponse<BrandResponseDTO> response = ApiResponse.of(
                HttpStatus.OK,
                "Cập nhật thương hiệu thành công",
                responseDto
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<ApiResponse<Void>> deleteBrand(@PathVariable Integer id) {
        brandService.deleteBrand(id);

        ApiResponse<Void> response = ApiResponse.of(
                HttpStatus.OK,
                "Xóa thương hiệu thành công"
        );

        return ResponseEntity.ok(response);
    }

    private BrandResponseDTO convertToResponseWithLinks(BrandDTO dto, String baseUrl) {
        // Chuyển đổi từ BrandDTO sang BrandResponseDTO
        BrandResponseDTO responseDto = new BrandResponseDTO(
            dto.brandId(),
            dto.brandName(),
            dto.logoPublicId(),
            dto.createdAt(),
            dto.updatedAt()
        );

        // Thêm các links
        String resourceUrl = baseUrl + "/api/user/brands/" + dto.brandId();
        String collectionUrl = baseUrl + "/api/user/brands";

        responseDto = responseDto.addLink("self", resourceUrl);
        responseDto = responseDto.addLink("brands", collectionUrl);
        responseDto = responseDto.addLink("update", resourceUrl);
        responseDto = responseDto.addLink("delete", resourceUrl);

        return responseDto;
    }

    private String getBaseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();

        StringBuilder url = new StringBuilder();
        url.append(scheme).append("://").append(serverName);

        if ((serverPort != 80) && (serverPort != 443)) {
            url.append(":").append(serverPort);
        }

        return url.toString();
    }
}