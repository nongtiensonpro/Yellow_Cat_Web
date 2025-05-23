package org.yellowcat.backend.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yellowcat.backend.product.attribute.Attributes;
import org.yellowcat.backend.product.attribute.AttributesRepository;
import org.yellowcat.backend.product.attributevalue.AttributeValue;
import org.yellowcat.backend.product.attributevalue.AttributeValueRepository;
import org.yellowcat.backend.product.brand.Brand;
import org.yellowcat.backend.product.brand.BrandRepository;
import org.yellowcat.backend.product.category.Category;
import org.yellowcat.backend.product.category.CategoryRepository;
import org.yellowcat.backend.product.dto.*;
import org.yellowcat.backend.product.productattribute.ProductAttribute;
import org.yellowcat.backend.product.productattribute.ProductAttributeRepository;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.product.variant.VariantAttribute;
import org.yellowcat.backend.product.variant.VariantAttributeRepository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.*;

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

        List<ProductListItemDTO> productDTOs = productRepository.findAllProductsPaginated(pageSize, offset);
        long totalProducts = productRepository.countTotalProducts();

        return new PageImpl<>(productDTOs, pageable, totalProducts);
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
                VariantDTO variant = variantMap.get(variantId);

                if (variant == null) {
                    variant = new VariantDTO();
                    variant.setVariantId(variantId);
                    variant.setSku((String) row[index++]);
                    variant.setPrice((BigDecimal) row[index++]);
                    variant.setStockLevel((Integer) row[index++]);
                                        variant.setImageUrl((String) row[index++]);                    variant.setWeight((Double) row[index++]);                    variant.setVariantAttributes((String) row[index++]);                    index++; // Skip active promotions field

                    variantMap.put(variantId, variant);
                    productDetail.getVariants().add(variant);
                } else {
                    // Skip variant fields if already processed
                    index += 7; // Tăng index lên 7 để bỏ qua các trường variant đã xử lý (bao gồm cả weight mới)
                }
            }
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
        product.setIsActive(true);
        product = productRepository.save(product);

        // Cache AttributeValue đã xử lý để không truy lại DB
        Map<String, AttributeValue> attributeValueCache = new HashMap<>();

        // Xử lý các thuộc tính chung của sản phẩm
        for (ProductWithVariantsRequestDTO.ProductAttributeDTO productAttributeDTO : productDto.getProductAttributes()) {
            for (ProductWithVariantsRequestDTO.AttributeDTO attrDTO : productAttributeDTO.getAttributes()) {
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

        // Xử lý các biến thể
        for (ProductWithVariantsRequestDTO.VariantDTO variantDto : productDto.getVariants()) {
            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);

            // Tự sinh SKU nếu thiếu
            String sku = (variantDto.getSku() == null || variantDto.getSku().isBlank())
                    ? generateUniqueSku(product.getId())
                    : variantDto.getSku();
            variant.setSku(sku);

            variant.setPrice(variantDto.getPrice());
            variant.setStockLevel(variantDto.getStockLevel());
            variant.setImageUrl(variantDto.getImageUrl());
            variant.setWeight(variantDto.getWeight());

            variant = productVariantRepository.save(variant);

            // Gắn thuộc tính cho từng biến thể
            for (ProductWithVariantsRequestDTO.AttributeDTO attributeDto : variantDto.getAttributes()) {
                String key = attributeDto.getAttributeId() + "_" + attributeDto.getValue();
                AttributeValue attributeValue = attributeValueCache.get(key);

                if (attributeValue == null) {
                    attributeValue = attributeValueRepository.findByAttributeIdAndValue(
                            attributeDto.getAttributeId(),
                            attributeDto.getValue()
                    ).orElseGet(() -> {
                        Attributes attribute = attributesRepository.findById(attributeDto.getAttributeId())
                                .orElseThrow(() -> new RuntimeException("Attribute not found: " + attributeDto.getAttributeId()));
                        AttributeValue newVal = new AttributeValue();
                        newVal.setAttribute(attribute);
                        newVal.setValue(attributeDto.getValue());
                        return attributeValueRepository.save(newVal);
                    });
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

        // 4. Xóa thuộc tính cũ của sản phẩm
        productAttributeRepository.deleteByProductId(product.getId());

        // 5. Cache AttributeValue để tiết kiệm truy vấn
        Map<String, AttributeValue> attributeValueCache = new HashMap<>();

        // 6. Xử lý thuộc tính chung của sản phẩm
        if (productDto.getProductAttributes() != null) {
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
        }

        // 7. Xử lý biến thể
        List<ProductVariant> existingVariants = productVariantRepository.findByProductId(product.getId());

        // Tạo Map để dễ lookup theo sku
        Map<String, ProductVariant> existingVariantsMap = new HashMap<>();
        for (ProductVariant variant : existingVariants) {
            existingVariantsMap.put(variant.getSku(), variant);
        }

        // SKU của biến thể mới trong request
        Set<String> newVariantSkus = new HashSet<>();

        if (productDto.getVariants() != null) {
            for (ProductWithVariantsUpdateRequestDTO.VariantDTO variantDto : productDto.getVariants()) {
                newVariantSkus.add(variantDto.getSku());

                ProductVariant variant = existingVariantsMap.get(variantDto.getSku());

                if (variant == null) {
                    // Nếu biến thể mới chưa tồn tại thì tạo mới
                    variant = new ProductVariant();
                    variant.setProduct(product);
                    variant.setSku(variantDto.getSku());
                }

                // Cập nhật thông tin biến thể
                variant.setPrice(variantDto.getPrice());
                variant.setStockLevel(variantDto.getStockLevel());
                variant.setImageUrl(variantDto.getImageUrl());
                variant.setWeight(variantDto.getWeight());

                variant = productVariantRepository.save(variant);

                // Xóa thuộc tính của biến thể này trước khi thêm lại
                variantAttributeRepository.deleteByVariantId(variant.getId());

                // Thêm lại thuộc tính biến thể
                if (variantDto.getAttributes() != null) {
                    for (ProductWithVariantsUpdateRequestDTO.AttributeDTO attributeDto : variantDto.getAttributes()) {
                        String key = attributeDto.getAttributeId() + "_" + attributeDto.getValue();
                        AttributeValue attributeValue = attributeValueCache.get(key);

                        if (attributeValue == null) {
                            attributeValue = attributeValueRepository.findByAttributeIdAndValue(
                                    attributeDto.getAttributeId(),
                                    attributeDto.getValue()
                            ).orElseGet(() -> {
                                Attributes attribute = attributesRepository.findById(attributeDto.getAttributeId())
                                        .orElseThrow(() -> new RuntimeException("Attribute not found: " + attributeDto.getAttributeId()));
                                AttributeValue newVal = new AttributeValue();
                                newVal.setAttribute(attribute);
                                newVal.setValue(attributeDto.getValue());
                                return attributeValueRepository.save(newVal);
                            });
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

        // 8. Xóa biến thể cũ không còn trong danh sách mới
        for (ProductVariant oldVariant : existingVariants) {
            if (!newVariantSkus.contains(oldVariant.getSku())) {
                // Xóa thuộc tính của biến thể
                variantAttributeRepository.deleteByVariantId(oldVariant.getId());
                // Xóa biến thể
                productVariantRepository.delete(oldVariant);
            }
        }
        productVariantRepository.flush();
    }

    private String generateUniqueSku(Integer productId) {
        String sku;
        do {
            sku = "SKU-" + productId + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } while (productVariantRepository.existsBySku(sku));
        return sku;
    }
}