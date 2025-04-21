package org.yellowcat.backend.product;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Pageable;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.dto.ProductDto;
import org.yellowcat.backend.product.dto.ProductDetailDTO;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Get all products", description = "Returns a list of all products")
    public ResponseEntity<?> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductDto> productPage = productService.getAllProducts(pageable);
        return ResponseEntityBuilder.success(productPage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductDetails(@PathVariable("id") Integer productId) {
        ProductDetailDTO productDetail = productService.getProductDetailById(productId);

        if (productDetail == null) {
            return ResponseEntityBuilder.notFound("Product not found", "Product with id " + productId + " not found");
        }

        return ResponseEntityBuilder.success(productDetail);
    }
}
