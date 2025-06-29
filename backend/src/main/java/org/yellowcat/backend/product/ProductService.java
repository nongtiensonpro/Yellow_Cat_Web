package org.yellowcat.backend.product;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yellowcat.backend.product.brand.Brand;
import org.yellowcat.backend.product.brand.BrandRepository;
import org.yellowcat.backend.product.category.Category;
import org.yellowcat.backend.product.category.CategoryRepository;
import org.yellowcat.backend.product.color.Color;
import org.yellowcat.backend.product.color.ColorRepository;
import org.yellowcat.backend.product.dto.*;
import org.yellowcat.backend.product.material.Material;
import org.yellowcat.backend.product.material.MaterialRepository;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.product.size.Size;
import org.yellowcat.backend.product.size.SizeRepository;
import org.yellowcat.backend.product.targetaudience.TargetAudience;
import org.yellowcat.backend.product.targetaudience.TargetAudienceRepository;
import org.yellowcat.backend.user.AppUser;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final MaterialRepository materialRepository;
    private final TargetAudienceRepository targetAudienceRepository;
    private final ColorRepository colorRepository;
    private final SizeRepository sizeRepository;


    public Page<ProductListItemDTO> getProductsPaginated(Pageable pageable) {
        int pageSize = pageable.getPageSize();
        int offset = (int) pageable.getOffset();

        List<ProductListItemDTO> productDTOs = productRepository.findAllProduct(pageSize, offset);
        long totalProducts = productRepository.countTotalProducts();

        return new PageImpl<>(productDTOs, pageable, totalProducts);
    }

    public Page<ProductListItemManagementDTO> getProductManagement(int page, int size) {
        Sort sort = Sort.by("updatedAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        int pageSize = pageable.getPageSize();
        int offset = (int) pageable.getOffset();

        List<ProductListItemManagementDTO> productDTOs = productRepository.findAllProductManagement(pageSize, offset);
        long totalProducts = productRepository.countTotalProducts();

        return new PageImpl<>(productDTOs, pageable, totalProducts);
    }

    public ProductDetailDTO getProductDetailById(Integer productId) {
        List<Object[]> results = productRepository.findProductDetailRawByProductId(productId);
        if (results == null || results.isEmpty()) {
            return null; // Or throw NotFoundException
        }

        ProductDetailDTO productDetailDTO = null;
        List<ProductVariantDTO> variants = new ArrayList<>();

        for (Object[] row : results) {
            if (productDetailDTO == null) {
                productDetailDTO = new ProductDetailDTO();
                productDetailDTO.setProductId((Integer) row[0]);
                productDetailDTO.setProductName((String) row[1]);
                productDetailDTO.setDescription((String) row[2]);
                productDetailDTO.setMaterialId((Integer) row[3]);
                productDetailDTO.setTargetAudienceId((Integer) row[4]);
                productDetailDTO.setPurchases((Integer) row[5]);
                productDetailDTO.setIsActive((Boolean) row[6]);
                productDetailDTO.setCategoryId((Integer) row[7]);
                productDetailDTO.setCategoryName((String) row[8]);
                productDetailDTO.setBrandId((Integer) row[9]);
                productDetailDTO.setBrandName((String) row[10]);
                productDetailDTO.setBrandInfo((String) row[11]);
                productDetailDTO.setLogoPublicId((String) row[12]);
                productDetailDTO.setThumbnail((String) row[13]);
            }

            if (row[14] != null) {
                ProductVariantDTO variantDTO = new ProductVariantDTO();
                variantDTO.setVariantId((Integer) row[14]);
                variantDTO.setSku((String) row[15]);
                variantDTO.setColorId((Integer) row[16]);
                variantDTO.setSizeId((Integer) row[17]);
                variantDTO.setPrice((BigDecimal) row[18]); // Ensure correct type casting
                variantDTO.setStockLevel((Integer) row[19]);
                variantDTO.setImageUrl((String) row[20]);
                variantDTO.setWeight((Double) row[21]); // Ensure correct type casting
                variants.add(variantDTO);
            }
        }

        productDetailDTO.setVariants(variants);

        return productDetailDTO;
    }

    @Transactional
    public void createProduct(ProductWithVariantsRequestDTO productDto, AppUser appUser) {
        // Tìm Brand & Category (có thể throw nếu không tồn tại)
        Brand brand = brandRepository.findById(productDto.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        Category category = categoryRepository.findById(productDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        Material material = materialRepository.findById(productDto.getMaterialId())
                .orElseThrow(() -> new RuntimeException("Material not found"));
        TargetAudience targetAudience = targetAudienceRepository.findById(productDto.getTargetAudienceId())
                .orElseThrow(() -> new RuntimeException("Target Audience not found"));

        // Tạo sản phẩm
        Product product = new Product();
        product.setProductName(productDto.getProductName());
        product.setDescription(productDto.getDescription());
        product.setBrand(brand);
        product.setCategory(category);
        product.setMaterial(material);
        product.setTargetAudience(targetAudience);
        product.setThumbnail(productDto.getThumbnail());
        product.setCreatedBy(appUser);
        product = productRepository.save(product);

        // Xử lý các biến thể
        for (ProductWithVariantsRequestDTO.ProductVariantDTO variantDto : productDto.getVariants()) {
            Color color = colorRepository.findById(variantDto.getColorId())
                    .orElseThrow(() -> new RuntimeException("Color not found"));
            Size size = sizeRepository.findById(variantDto.getSizeId())
                    .orElseThrow(() -> new RuntimeException("Size not found"));

            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);

            // Tự sinh SKU nếu thiếu
            String sku = (variantDto.getSku() == null || variantDto.getSku().isBlank())
                    ? generateUniqueSku(product.getProductId())
                    : variantDto.getSku();
            variant.setSku(sku);

            variant.setColor(color);
            variant.setSize(size);
            variant.setPrice(variantDto.getPrice());
            variant.setQuantityInStock(variantDto.getStockLevel());
            variant.setImageUrl(variantDto.getImageUrl());
            variant.setWeight(variantDto.getWeight());
            variant.setCreatedBy(appUser);
            productVariantRepository.save(variant);
        }
    }

    @Transactional
    public void updateProduct(ProductWithVariantsUpdateRequestDTO productDto, AppUser appUser) {
        // 1. Tìm Product cũ
        Product product = productRepository.findById(productDto.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productDto.getProductId()));

        // 2. Tìm Brand & Category
        Brand brand = brandRepository.findById(productDto.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        Category category = categoryRepository.findById(productDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        Material material = materialRepository.findById(productDto.getMaterialId())
                .orElseThrow(() -> new RuntimeException("Material not found"));
        TargetAudience targetAudience = targetAudienceRepository.findById(productDto.getTargetAudienceId())
                .orElseThrow(() -> new RuntimeException("Target Audience not found"));

        // 3. Cập nhật thông tin sản phẩm
        product.setProductName(productDto.getProductName());
        product.setDescription(productDto.getDescription());
        product.setBrand(brand);
        product.setCategory(category);
        product.setMaterial(material);
        product.setTargetAudience(targetAudience);
        product.setThumbnail(productDto.getThumbnail());
        product.setCreatedBy(appUser);
        product = productRepository.save(product);

        // 4. Xử lý biến thể
        List<ProductVariant> existingVariants = productVariantRepository.findByProductId(product.getProductId());

        // Tạo Map để dễ lookup theo sku
        Map<String, ProductVariant> existingVariantsMap = new HashMap<>();
        for (ProductVariant variant : existingVariants) {
            existingVariantsMap.put(variant.getSku(), variant);
        }

        // SKU của biến thể mới trong request
        Set<String> newVariantSkus = new HashSet<>();

        if (productDto.getVariants() != null) {
            for (ProductWithVariantsUpdateRequestDTO.ProductVariantDTO variantDto : productDto.getVariants()) {
                Color color = colorRepository.findById(variantDto.getColorId())
                        .orElseThrow(() -> new RuntimeException("Color not found"));
                Size size = sizeRepository.findById(variantDto.getSizeId())
                        .orElseThrow(() -> new RuntimeException("Size not found"));

                newVariantSkus.add(variantDto.getSku());
                ProductVariant variant = existingVariantsMap.get(variantDto.getSku());

                if (variant == null) {
                    // Nếu biến thể mới chưa tồn tại thì tạo mới
                    variant = new ProductVariant();
                    variant.setProduct(product);
                    variant.setSku(variantDto.getSku());
                }

                // Cập nhật thông tin biến thể
                variant.setColor(color);
                variant.setSize(size);
                variant.setPrice(variantDto.getPrice());
                variant.setQuantityInStock(variantDto.getStockLevel());
                variant.setImageUrl(variantDto.getImageUrl());
                variant.setWeight(variantDto.getWeight());
                variant.setCreatedBy(appUser);
                productVariantRepository.save(variant);
            }
        }

        // 5 Xóa biến thể cũ không còn trong danh sách mới
        for (ProductVariant oldVariant : existingVariants) {
            if (!newVariantSkus.contains(oldVariant.getSku())) {
                productVariantRepository.delete(oldVariant);
            }
        }
        productVariantRepository.flush();
    }

    public void deleteProduct(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));

        if (product.getPurchases() > 0) {
            // Chỉ đánh dấu là không còn hoạt động thay vì xóa
            product.setIsActive(false);
            productRepository.save(product);
        } else {
            // Nếu chưa được mua, có thể xóa hẳn
            productRepository.delete(product);
        }
    }

    public void activeornotactive(Integer productId){
        productRepository.activeornotactive(productId);
    }

    private String generateUniqueSku(Integer productId) {
        String sku;
        do {
            sku = "SKU-" + productId + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } while (productVariantRepository.existsBySku(sku));
        return sku;
    }
}