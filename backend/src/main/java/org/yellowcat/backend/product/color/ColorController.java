package org.yellowcat.backend.product.color;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.color.dto.ColorCreateDto;
import org.yellowcat.backend.product.color.dto.ColorRequestDto;
import org.yellowcat.backend.product.color.dto.ColorResponse;

@RestController
@RequestMapping("/api/colors")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ColorController {
    ColorService colorService;

    @GetMapping
    public ResponseEntity<?> getAllColor(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ColorResponse> categories = colorService.getAllColors(page, size);
        PageResponse<ColorResponse> pageResponse = new PageResponse<>(categories);
        return ResponseEntityBuilder.success(pageResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getColorById(@PathVariable Integer id) {
        return ResponseEntityBuilder.success(colorService.getColorById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> addColor(@RequestBody ColorCreateDto request) {
        return ResponseEntityBuilder.success(colorService.addColor(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<ColorResponse> updateColor(@PathVariable Integer id, @RequestBody ColorRequestDto request) {
        return ResponseEntity.ok(colorService.updateColor(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<Boolean> deleteColor(@PathVariable Integer id) {
        return ResponseEntity.ok(colorService.deleteColor(id));
    }
}
