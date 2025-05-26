package org.yellowcat.backend.product.category;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.product.category.dto.CategoryCreateDto;
import org.yellowcat.backend.product.category.dto.CategoryRequestDto;
import org.yellowcat.backend.product.category.dto.CategoryResponse;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryController {
    CategoryService categoryService;

    @GetMapping
    public ResponseEntity<?> getAllCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<CategoryResponse> categories = categoryService.getAllCategories(page, size);
        PageResponse<CategoryResponse> pageResponse = new PageResponse<>(categories);
        return ResponseEntityBuilder.success(pageResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable Integer id) {
        return ResponseEntityBuilder.success(categoryService.getCategoryById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> addCategory(@RequestBody CategoryCreateDto request) {
        return ResponseEntityBuilder.success(categoryService.addCategory(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<CategoryResponse> updateCategory(@PathVariable Integer id, @RequestBody CategoryRequestDto request) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<Boolean> deleteCategory(@PathVariable Integer id) {
        return ResponseEntity.ok(categoryService.deleteCategory(id));
    }
}
