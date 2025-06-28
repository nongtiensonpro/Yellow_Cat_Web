package org.yellowcat.backend.product;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.dto.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Get all products", description = "Returns a paginated list of products with detailed information")
    public ResponseEntity<?> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ProductListItemDTO> productPage = productService.getProductsPaginated(pageable);
            return ResponseEntityBuilder.success(productPage);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Error retrieving products", "Error retrieving products");
        }
    }

    @GetMapping("/management")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    @Operation(summary = "Get all products", description = "Returns a paginated list of products with detailed information")
    public ResponseEntity<?> getAllProductsManagement(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Page<ProductListItemManagementDTO> productPage = productService.getProductManagement(page, size);
            return ResponseEntityBuilder.success(productPage);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Error retrieving products", "Error retrieving products");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductDetails(@PathVariable("id") Integer productId) {
        ProductDetailDTO productDetail = productService.getProductDetailById(productId);

        if (productDetail == null) {
            return ResponseEntityBuilder.notFound("Product not found", "Product with id " + productId + " not found");
        }

        return ResponseEntityBuilder.success(productDetail);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> deleteProduct(@PathVariable("id") Integer productId) {
        productService.deleteProduct(productId);
        return ResponseEntityBuilder.success("Product deleted successfully!");
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> createProduct(@RequestBody ProductWithVariantsRequestDTO productDto) {
        productService.createProduct(productDto);
        return ResponseEntityBuilder.success("Product created successfully!");
    }

    @PutMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> updateProduct(@RequestBody ProductWithVariantsUpdateRequestDTO productDto) {
        productService.updateProduct(productDto);
        return ResponseEntityBuilder.success("Product updated successfully!");
    }

    @GetMapping("/activeornotactive/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> getActiveornotactive(@PathVariable("id") Integer productId) {
        productService.activeornotactive(productId);
        return ResponseEntityBuilder.success("Product active successfully!");
    }
}