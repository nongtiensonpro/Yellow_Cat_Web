package org.yellowcat.backend.product.size;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.size.dto.SizeCreateDto;
import org.yellowcat.backend.product.size.dto.SizeRequestDto;
import org.yellowcat.backend.product.size.dto.SizeResponse;

@RestController
@RequestMapping("/api/sizes")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SizeController {
    SizeService sizeService;

    @GetMapping
    public ResponseEntity<?> getAllSize(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<SizeResponse> categories = sizeService.getAllSize(page, size);
        PageResponse<SizeResponse> pageResponse = new PageResponse<>(categories);
        return ResponseEntityBuilder.success(pageResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSizeById(@PathVariable Integer id) {
        return ResponseEntityBuilder.success(sizeService.getSizeById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> addSize(@RequestBody SizeCreateDto request) {
        return ResponseEntityBuilder.success(sizeService.addSize(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<SizeResponse> updateSize(@PathVariable Integer id, @RequestBody SizeRequestDto request) {
        return ResponseEntity.ok(sizeService.updateSize(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<Boolean> deleteSize(@PathVariable Integer id) {
        return ResponseEntity.ok(sizeService.deleteSize(id));
    }

    @PutMapping("/status/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<Boolean> updateStatus(@PathVariable Integer id) {
        return ResponseEntity.ok(sizeService.updateStatusSize(id));
    }
}
