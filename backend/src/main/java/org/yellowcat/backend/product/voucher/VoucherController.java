package org.yellowcat.backend.product.voucher;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.voucher.dto.VoucherRequest;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VoucherController {

    final VoucherService voucherService;
    final VoucherRepository voucherRepository;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> createVoucher(
            @RequestBody VoucherRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        voucherService.create(request, userId);
        return ResponseEntityBuilder.success("Tạo voucher thành công!");
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> getVoucherById(@PathVariable Integer id) {
        try {
            return ResponseEntityBuilder.success(voucherService.getById(id));
        } catch (Exception e) {
            return ResponseEntityBuilder.error(org.springframework.http.HttpStatus.NOT_FOUND, e.getMessage(), e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> updateVoucher(
            @PathVariable Integer id,
            @RequestBody VoucherRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        // TODO: Có thể kiểm tra quyền createdBy ở đây
        try {
            voucherService.update(id, request);
            return ResponseEntityBuilder.success("Cập nhật voucher thành công!");
        } catch (IllegalArgumentException ex) {
            return ResponseEntityBuilder.error(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getMessage(), ex.getMessage());
        }
    }

    @GetMapping("/check-name")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> checkName(
            @RequestParam String name,
            @RequestParam(required = false) Integer excludeId
    ) {
        String normalized = name == null ? "" : name.trim().replaceAll("\\s{2,}", " ");
        boolean exists = (excludeId == null)
                ? voucherRepository.existsByVoucherNameIgnoreCase(normalized)
                : voucherRepository.existsByVoucherNameIgnoreCaseAndVoucherIdNot(normalized, excludeId);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> listVouchers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String discountType,
            @RequestParam(required = false) java.math.BigDecimal discountValue,
            @org.springframework.data.web.PageableDefault(size = 5, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) org.springframework.data.domain.Pageable pageable
    ) {
        org.springframework.data.domain.Page<org.yellowcat.backend.product.voucher.dto.VoucherResponse> result =
                voucherService.findWithFilters(keyword, status, discountType, discountValue, pageable);

        org.yellowcat.backend.common.config_api.response.PageResponse<org.yellowcat.backend.product.voucher.dto.VoucherResponse> pageResponse =
                new org.yellowcat.backend.common.config_api.response.PageResponse<>(result);

        return org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder.success(pageResponse);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> deleteVoucher(@PathVariable Integer id) {
        voucherService.delete(id);
        return ResponseEntityBuilder.success("Xóa voucher thành công!");
    }
} 