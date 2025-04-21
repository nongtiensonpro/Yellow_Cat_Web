package org.yellowcat.backend.product;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.dto.ProductDto;
import org.yellowcat.backend.product.dto.ProductDetailDTO;
import org.yellowcat.backend.product.dto.ProductMapper;
import org.yellowcat.backend.product.dto.VariantDTO;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    ProductService(ProductRepository productRepository, ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
    }

    Page<ProductDto> getAllProducts(Pageable pageable) {
        Page<Product> products = productRepository.findAll(pageable);
        return products.map(productMapper::toDto);
    }

    public ProductDetailDTO getProductDetailById(Integer productId) {
        List<Object[]> results = productRepository.findProductDetailById(productId);

        if (results.isEmpty()) {
            return null;
        }

        // Create the product detail DTO
        ProductDetailDTO productDetail = new ProductDetailDTO();
        Map<Integer, VariantDTO> variantMap = new HashMap<>();

        // Process each row from the query result
        for (Object[] row : results) {
            int index = 0;

            // If this is the first row, populate the product details
            if (productDetail.getProductId() == null) {
                productDetail.setProductId((Integer) row[index++]);
                productDetail.setProductName((String) row[index++]);
                productDetail.setDescription((String) row[index++]);
                productDetail.setPurchases((Integer) row[index++]);

                Timestamp createdAt = (Timestamp) row[index++];
                productDetail.setProductCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : null);

                Timestamp updatedAt = (Timestamp) row[index++];
                productDetail.setProductUpdatedAt(updatedAt != null ? updatedAt.toLocalDateTime() : null);

                productDetail.setIsActive((Boolean) row[index++]);
                productDetail.setCategoryId((Integer) row[index++]);
                productDetail.setCategoryName((String) row[index++]);
                productDetail.setBrandId((Integer) row[index++]);
                productDetail.setBrandName((String) row[index++]);
                productDetail.setBrandInfo((String) row[index++]);
                productDetail.setLogoPublicId((String) row[index++]);

                // Initialize the variants list
                productDetail.setVariants(new ArrayList<>());
            } else {
                // Skip product fields if already populated
                index = 13; // Skip to variant fields
            }

            // Process variant data
            Integer variantId = (Integer) row[index++];

            // Only process variant if it exists
            if (variantId != null) {
                // Check if we've already seen this variant
                if (!variantMap.containsKey(variantId)) {
                    VariantDTO variant = new VariantDTO();
                    variant.setVariantId(variantId);
                    variant.setSku((String) row[index++]);
                    variant.setPrice((BigDecimal) row[index++]);
                    variant.setStockLevel((Integer) row[index++]);
                    variant.setImageUrl((String) row[index++]);
                    // Lấy giá trị weight dưới dạng BigDecimal và chuyển đổi sang Double
                    BigDecimal weightBigDecimal = (BigDecimal) row[index++];
                    variant.setWeight(weightBigDecimal != null ? weightBigDecimal.doubleValue() : null);
                    variant.setVariantAttributes((String) row[index++]);

                    variantMap.put(variantId, variant);
                    productDetail.getVariants().add(variant);
                } else {
                    // Skip variant fields if already processed
                    index += 7; // Tăng index lên 7 để bỏ qua các trường variant đã xử lý (bao gồm cả weight mới)
                }
            } else {
                // Skip variant fields if no variant
                index += 7; // Tăng index lên 7 để bỏ qua các trường variant (bao gồm cả weight)
            }

            // Set active promotions (should be the same for all rows)
            // Cần kiểm tra index này có đúng không sau khi thay đổi ở trên
            String activePromotions = (String) row[index];
            productDetail.setActivePromotions(activePromotions);
        }

        return productDetail;
    }
}