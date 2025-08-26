package org.yellowcat.backend.product;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.dto.*;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserService;
import org.yellowcat.backend.product.dto.VariantPromosDTO;
import org.yellowcat.backend.product.category.Category;
import org.yellowcat.backend.product.category.CategoryRepository;
import org.yellowcat.backend.product.brand.Brand;
import org.yellowcat.backend.product.brand.BrandRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final AppUserService appUserService;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    public ProductController(ProductService productService, AppUserService appUserService, 
                           CategoryRepository categoryRepository, BrandRepository brandRepository) {
        this.productService = productService;
        this.appUserService = appUserService;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
    }
    @GetMapping("/ai-overview")
    @Operation(summary = "Get products overview for AI", description = "Returns optimized product data for AI to provide customer recommendations")
    public ResponseEntity<?> getProductsOverviewForAI() {
        try {
            List<ProductOverviewForAIDTO> productsOverview = productService.getProductsOverviewForAI();
            return ResponseEntityBuilder.success(productsOverview);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving products overview for AI", e.getMessage());
        }
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get products with low stock", description = "Returns a list of products with total stock below a specified threshold.")
    @PreAuthorize("hasAnyAuthority('Admin_Web')") // Assuming this is an admin-only feature
    public ResponseEntity<?> getLowStockProducts(@RequestParam(defaultValue = "10") int threshold) {
        try {
            List<ProductListItemDTO> lowStockProducts = productService.getLowStockProducts(threshold);
            return ResponseEntityBuilder.success(lowStockProducts);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving low stock products", e.getMessage());
        }
    }


    @GetMapping("/top-selling")
    @Operation(summary = "Get top 5 best-selling products", description = "Returns a list of the top 5 products ordered by purchase count.")
    public ResponseEntity<?> getTopSellingProducts() {
        try {
            List<ProductListItemDTO> topProducts = productService.getTop5BestSellingProducts();
            return ResponseEntityBuilder.success(topProducts);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving top-selling products", e.getMessage());
        }
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
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer brandId
    ) {
        try {
            Page<ProductListItemManagementDTO> productPage = productService.getProductManagement(page, size, search, categoryId, brandId);
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
    public ResponseEntity<?> createProduct(@RequestBody ProductWithVariantsRequestDTO productDto,
                                           @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        Optional<AppUser> appUser = appUserService.findByKeycloakId(userId);
        AppUser user;
        if (appUser.isEmpty()) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "User not found", "User not found");
        } else {
            user = appUser.get();
        }
        productService.createProduct(productDto, user);
        return ResponseEntityBuilder.success("Product created successfully!");
    }

    @PutMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> updateProduct(@RequestBody ProductWithVariantsUpdateRequestDTO productDto,
                                           @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());

        Optional<AppUser> appUser = appUserService.findByKeycloakId(userId);
        AppUser user;
        if (appUser.isEmpty()) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "User not found", "User not found");
        } else {
            user = appUser.get();
        }

        productService.updateProduct(productDto, user);

        return ResponseEntityBuilder.success("Product updated successfully!");
    }

    @GetMapping("/activeornotactive/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> getActiveornotactive(@PathVariable("id") Integer productId) {
        productService.activeornotactive(productId);
        return ResponseEntityBuilder.success("Product active successfully!");
    }

    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    @PostMapping("/rollback/{historyId}")
    public ResponseEntity<?> rollbackProduct(
            @PathVariable("historyId") Integer historyId
    ) {
        // Thực hiện rollback
        productService.rollback(historyId);

        return ResponseEntityBuilder.success("Rollback Product successfully!");
    }

    @GetMapping("/product-history")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> getAllProductHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Page<ProductHistoryDto> productHistoryPage = productService.findAllProductHistory(size, page);
            return ResponseEntityBuilder.success(productHistoryPage);
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Error retrieving product history", "Error retrieving product history");
        }
    }

    @GetMapping("/variant-history")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> getAllProductVariantHistoryByHistoryGroupId(
            @RequestParam("historyGroupId") UUID historyGroupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Page<ProductVariantHistoryDTO> productHistoryPage = productService.findAllByHistoryGroupId(historyGroupId, size, page);
            return ResponseEntityBuilder.success(productHistoryPage);
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Error retrieving product history", "Error retrieving product history");
        }
    }

    @GetMapping("/variant/{variantId}/promotions")
    public ResponseEntity<?> getVariantPromotions(@PathVariable("variantId") Integer variantId) {
        VariantPromosDTO dto = productService.getVariantPromotions(variantId);
        return ResponseEntityBuilder.success(dto);
    }

    @GetMapping("/categories")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    @Operation(summary = "Get all categories for combobox", description = "Returns a list of all categories for dropdown selection")
    public ResponseEntity<?> getAllCategoriesForCombobox() {
        try {
            List<Category> categories = categoryRepository.findAll();
            return ResponseEntityBuilder.success(categories);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving categories", e.getMessage());
        }
    }

    @GetMapping("/brands")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    @Operation(summary = "Get all brands for combobox", description = "Returns a list of all brands for dropdown selection")
    public ResponseEntity<?> getAllBrandsForCombobox() {
        try {
            List<Brand> brands = brandRepository.findAll();
            return ResponseEntityBuilder.success(brands);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving brands", e.getMessage());
        }
    }
}