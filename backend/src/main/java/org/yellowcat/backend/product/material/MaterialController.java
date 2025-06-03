package org.yellowcat.backend.product.material;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.material.dto.MaterialCreateDto;
import org.yellowcat.backend.product.material.dto.MaterialRequestDto;
import org.yellowcat.backend.product.material.dto.MaterialResponse;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MaterialController {
    MaterialService materialService;

    @GetMapping
    public ResponseEntity<?> getAllSize(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<MaterialResponse> categories = materialService.getAllMaterials(page, size);
        PageResponse<MaterialResponse> pageResponse = new PageResponse<>(categories);
        return ResponseEntityBuilder.success(pageResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSizeById(@PathVariable Integer id) {
        return ResponseEntityBuilder.success(materialService.getMaterialById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> addSize(@RequestBody MaterialCreateDto request) {
        return ResponseEntityBuilder.success(materialService.addMaterial(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<MaterialResponse> updateSize(@PathVariable Integer id, @RequestBody MaterialRequestDto request) {
        return ResponseEntity.ok(materialService.updateMaterial(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<Boolean> deleteSize(@PathVariable Integer id) {
        return ResponseEntity.ok(materialService.deleteMaterial(id));
    }
}
