package org.yellowcat.backend.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yellowcat.backend.product.attribute.Attributes;
import org.yellowcat.backend.product.attribute.AttributesRepository;
import org.yellowcat.backend.product.brand.Brand;
import org.yellowcat.backend.product.brand.BrandRepository;
import org.yellowcat.backend.product.category.Category;
import org.yellowcat.backend.product.category.CategoryRepository;
import org.yellowcat.backend.product.dto.*;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final AttributeValueRepository attributeValueRepository;
    private final VariantAttributeRepository variantAttributeRepository;
    private final AttributesRepository attributesRepository;
    private final ProductAttributeRepository productAttributeRepository;
    ;
    private final ProductMapper productMapper;

    ProductService(ProductRepository productRepository,
                   ProductMapper productMapper,
                   BrandRepository brandRepository,
                   CategoryRepository categoryRepository,
                   ProductVariantRepository productVariantRepository,
                   AttributeValueRepository attributeValueRepository,
                   VariantAttributeRepository variantAttributeRepository,
                   AttributesRepository attributesRepository,
                   ProductAttributeRepository productAttributeRepository) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.brandRepository = brandRepository;
        this.categoryRepository = categoryRepository;
        this.productVariantRepository = productVariantRepository;
        this.attributeValueRepository = attributeValueRepository;
        this.variantAttributeRepository = variantAttributeRepository;
        this.attributesRepository = attributesRepository;
        this.productAttributeRepository = productAttributeRepository;
    }

    Page<ProductDto> getAllProducts(Pageable pageable) {
        Page<Product> products = productRepository.findAll(pageable);
        return products.map(productMapper::toDto);
    }

    public Page<ProductListItemDTO> getProductsPaginated(Pageable pageable) {
        int pageSize = pageable.getPageSize();
        int offset = (int) pageable.getOffset();

        List<Object[]> results = productRepository.findAllProductsPaginated(pageSize, offset);
        long totalProducts = productRepository.countTotalProducts();

        List<ProductListItemDTO> productDTOs = new ArrayList<>();

        for (Object[] row : results) {
            ProductListItemDTO dto = mapToProductListItemDTO(row);
            productDTOs.add(dto);
        }

        return new PageImpl<>(productDTOs, pageable, totalProducts);
    }

    private ProductListItemDTO mapToProductListItemDTO(Object[] row) {
        int index = 0;
        ProductListItemDTO dto = new ProductListItemDTO();

        dto.setProductId((Integer) row[index++]);
        dto.setProductName((String) row[index++]);
        dto.setDescription((String) row[index++]);

        // Xử lý purchases - có thể là Long hoặc Integer
        Object purchases = row[index++];
        if (purchases instanceof Integer) {
            dto.setPurchases((Integer) purchases);
        } else if (purchases instanceof Long) {
            dto.setPurchases(((Long) purchases).intValue());
        }

        Timestamp createdAt = (Timestamp) row[index++];
        dto.setCreatedAt(createdAt);

        Timestamp updatedAt = (Timestamp) row[index++];
        dto.setUpdatedAt(updatedAt);

        dto.setActive((Boolean) row[index++]);
        dto.setCategoryId((Integer) row[index++]);
        dto.setCategoryName((String) row[index++]);
        dto.setBrandId((Integer) row[index++]);
        dto.setBrandName((String) row[index++]);
        dto.setBrandInfo((String) row[index++]);
        dto.setLogoPublicId((String) row[index++]);

        // Xử lý minPrice - có thể là BigDecimal hoặc Double
        Object minPrice = row[index++];
        if (minPrice instanceof BigDecimal) {
            dto.setMinPrice(((BigDecimal) minPrice).doubleValue());
        } else if (minPrice instanceof Double) {
            dto.setMinPrice((Double) minPrice);
        } else if (minPrice instanceof Long) {
            dto.setMinPrice(((Long) minPrice).doubleValue());
        }

        // Xử lý totalStock - có thể là BigDecimal hoặc Long
        Object totalStock = row[index++];
        if (totalStock instanceof BigDecimal) {
            dto.setTotalStock(((BigDecimal) totalStock).longValue());
        } else if (totalStock instanceof Long) {
            dto.setTotalStock((Long) totalStock);
        } else if (totalStock instanceof Integer) {
            dto.setTotalStock(((Integer) totalStock).longValue());
        }

        dto.setThumbnail((String) row[index++]);
        dto.setActivePromotions((String) row[index]);

        return dto;
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

    @Transactional
    public void createProduct(ProductWithVariantsRequestDTO productDto) {
        // Tìm Brand & Category (có thể throw nếu không tồn tại)
        Brand brand = brandRepository.findById(productDto.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        Category category = categoryRepository.findById(productDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        // Tạo sản phẩm
        Product product = new Product();
        product.setProductName(productDto.getProductName());
        product.setDescription(productDto.getDescription());
        product.setBrand(brand);
        product.setCategory(category);
        product = productRepository.save(product);

        // Cache AttributeValue đã xử lý để không truy lại DB
        Map<String, AttributeValue> attributeValueCache = new HashMap<>();

        // Xử lý các thuộc tính chung của sản phẩm
        for (ProductWithVariantsRequestDTO.ProductAttributeDTO productAttributeDTO : productDto.getProductAttributes()) {
            for (ProductWithVariantsRequestDTO.AttributeDTO attrDTO : productAttributeDTO.getAttributes()) {
                String key = attrDTO.getAttributeId() + "_" + attrDTO.getValue();
                AttributeValue value = attributeValueCache.get(key);

                if (value == null) {
                    // Tìm hoặc tạo AttributeValue
                    value = attributeValueRepository
                            .findByAttributeIdAndValue(attrDTO.getAttributeId(), attrDTO.getValue())
                            .orElseGet(() -> {
                                Attributes attribute = attributesRepository.findById(attrDTO.getAttributeId())
                                        .orElseThrow(() -> new RuntimeException("Attribute not found: " + attrDTO.getAttributeId()));
                                AttributeValue newVal = new AttributeValue();
                                newVal.setAttribute(attribute);
                                newVal.setValue(attrDTO.getValue());
                                return attributeValueRepository.save(newVal);
                            });
                    attributeValueCache.put(key, value);
                }

                // Tạo ProductAttribute
                ProductAttribute productAttribute = new ProductAttribute();
                productAttribute.setProduct(product);
                productAttribute.setAttributeValue(value);
                productAttributeRepository.save(productAttribute);
            }
        }

        // Xử lý các biến thể
        for (ProductWithVariantsRequestDTO.VariantDTO variantDto : productDto.getVariants()) {
            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);
            variant.setSku(variantDto.getSku());
            variant.setPrice(variantDto.getPrice());
            variant.setStockLevel(variantDto.getStockLevel());
            variant.setImageUrl(variantDto.getImageUrl());

            variant = productVariantRepository.save(variant);

            // Gắn thuộc tính cho từng biến thể
            for (ProductWithVariantsRequestDTO.AttributeDTO attributeDto : variantDto.getAttributes()) {
                String key = attributeDto.getAttributeId() + "_" + attributeDto.getValue();
                AttributeValue attributeValue = attributeValueCache.get(key);

                if (attributeValue == null) {
                    // Tìm AttributeValue (chỉ tìm, không tạo mới ở đây để tránh sai logic)
                    attributeValue = attributeValueRepository.findByAttributeIdAndValue(
                            attributeDto.getAttributeId(),
                            attributeDto.getValue()
                    ).orElseThrow(() -> new RuntimeException("Attribute value not found for variant: " + key));
                    attributeValueCache.put(key, attributeValue);
                }

                VariantAttribute variantAttribute = new VariantAttribute();
                variantAttribute.setVariant(variant);
                variantAttribute.setAttributeValue(attributeValue);
                variantAttributeRepository.save(variantAttribute);
            }
        }
    }

    @Transactional
    public void updateProduct(ProductWithVariantsUpdateRequestDTO productDto) {
        // 1. Tìm Product cũ
        Product product = productRepository.findById(productDto.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productDto.getProductId()));

        // 2. Tìm Brand & Category
        Brand brand = brandRepository.findById(productDto.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        Category category = categoryRepository.findById(productDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        // 3. Cập nhật thông tin sản phẩm
        product.setProductName(productDto.getProductName());
        product.setDescription(productDto.getDescription());
        product.setBrand(brand);
        product.setCategory(category);
        product = productRepository.save(product);

        // 4. Xóa các thuộc tính và biến thể cũ
        productAttributeRepository.deleteByProductId(product.getId());
        List<ProductVariant> oldVariants = productVariantRepository.findByProductId(product.getId());
        for (ProductVariant old : oldVariants) {
            variantAttributeRepository.deleteByVariantId(old.getId());
        }
        productVariantRepository.deleteAll(oldVariants);

        // 5. Cache AttributeValue
        Map<String, AttributeValue> attributeValueCache = new HashMap<>();

        // 6. Xử lý thuộc tính chung của sản phẩm
        for (ProductWithVariantsUpdateRequestDTO.ProductAttributeDTO productAttributeDTO : productDto.getProductAttributes()) {
            for (ProductWithVariantsUpdateRequestDTO.AttributeDTO attrDTO : productAttributeDTO.getAttributes()) {
                String key = attrDTO.getAttributeId() + "_" + attrDTO.getValue();
                AttributeValue value = attributeValueCache.get(key);

                if (value == null) {
                    value = attributeValueRepository
                            .findByAttributeIdAndValue(attrDTO.getAttributeId(), attrDTO.getValue())
                            .orElseGet(() -> {
                                Attributes attribute = attributesRepository.findById(attrDTO.getAttributeId())
                                        .orElseThrow(() -> new RuntimeException("Attribute not found: " + attrDTO.getAttributeId()));
                                AttributeValue newVal = new AttributeValue();
                                newVal.setAttribute(attribute);
                                newVal.setValue(attrDTO.getValue());
                                return attributeValueRepository.save(newVal);
                            });
                    attributeValueCache.put(key, value);
                }

                ProductAttribute productAttribute = new ProductAttribute();
                productAttribute.setProduct(product);
                productAttribute.setAttributeValue(value);
                productAttributeRepository.save(productAttribute);
            }
        }

        // 7. Xử lý biến thể mới
        for (ProductWithVariantsUpdateRequestDTO.VariantDTO variantDto : productDto.getVariants()) {
            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);
            variant.setSku(variantDto.getSku());
            variant.setPrice(variantDto.getPrice());
            variant.setStockLevel(variantDto.getStockLevel());
            variant.setImageUrl(variantDto.getImageUrl());

            variant = productVariantRepository.save(variant);

            for (ProductWithVariantsUpdateRequestDTO.AttributeDTO attributeDto : variantDto.getAttributes()) {
                String key = attributeDto.getAttributeId() + "_" + attributeDto.getValue();
                AttributeValue attributeValue = attributeValueCache.get(key);

                if (attributeValue == null) {
                    attributeValue = attributeValueRepository.findByAttributeIdAndValue(
                            attributeDto.getAttributeId(),
                            attributeDto.getValue()
                    ).orElseThrow(() -> new RuntimeException("Attribute value not found for variant: " + key));
                    attributeValueCache.put(key, attributeValue);
                }

                VariantAttribute variantAttribute = new VariantAttribute();
                variantAttribute.setVariant(variant);
                variantAttribute.setAttributeValue(attributeValue);
                variantAttributeRepository.save(variantAttribute);
            }
        }
    }
}