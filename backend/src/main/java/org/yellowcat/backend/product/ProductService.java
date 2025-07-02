package org.yellowcat.backend.product;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
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
import org.yellowcat.backend.user.AppUserRepository;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

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
    private final ProductMapper productMapper;
    private final ProductHistoryRepository productHistoryRepository;
    private final ProductVariantHistoryRepository productVariantHistoryRepository;
    private final AppUserRepository appUserRepository;


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
    public void updateProduct(ProductWithVariantsUpdateRequestDTO dto, AppUser user) {
        // 1. Load existing
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found #" + dto.getProductId()));

        // 2. Write product history
        ProductsHistory ph = createProductHistory(product, user, 'U');
        UUID groupId = ph.getHistoryGroupId();

        // 3. Load associations
        Brand brand = brandRepository.findById(dto.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        Material material = materialRepository.findById(dto.getMaterialId())
                .orElseThrow(() -> new RuntimeException("Material not found"));
        TargetAudience audience = targetAudienceRepository.findById(dto.getTargetAudienceId())
                .orElseThrow(() -> new RuntimeException("Target Audience not found"));

        // 4. Update product fields
        product.setProductName(dto.getProductName());
        product.setDescription(dto.getDescription());
        product.setBrand(brand);
        product.setCategory(category);
        product.setMaterial(material);
        product.setTargetAudience(audience);
        product.setThumbnail(dto.getThumbnail());
        product.setCreatedBy(user);
        product = productRepository.save(product);

        // 5. Prefetch Color & Size
        List<Integer> colorIds = dto.getVariants().stream()
                .map(ProductWithVariantsUpdateRequestDTO.ProductVariantDTO::getColorId)
                .distinct().toList();
        Map<Integer, Color> colors = colorRepository.findAllById(colorIds)
                .stream().collect(Collectors.toMap(Color::getId, c -> c));

        List<Integer> sizeIds = dto.getVariants().stream()
                .map(ProductWithVariantsUpdateRequestDTO.ProductVariantDTO::getSizeId)
                .distinct().toList();
        Map<Integer, Size> sizes = sizeRepository.findAllById(sizeIds)
                .stream().collect(Collectors.toMap(Size::getId, s -> s));

        // 6. Load existing variants
        List<ProductVariant> existing = productVariantRepository.findByProductId(product.getProductId());
        Map<String, ProductVariant> existingMap = existing.stream()
                .collect(Collectors.toMap(ProductVariant::getSku, v -> v));

        Set<String> newSkus = new HashSet<>();
        List<ProductVariant> toSave = new ArrayList<>();

        // 7. Process new & updated variants
        for (var vDto : dto.getVariants()) {
            newSkus.add(vDto.getSku());
            ProductVariant v = existingMap.getOrDefault(vDto.getSku(), new ProductVariant());
            if (v.getVariantId() != null) {
                // history before update
                createVariantHistory(v, user, 'U', groupId);
            } else {
                v.setProduct(product);
                v.setSku(vDto.getSku());
                v.setCreatedBy(user);
            }
            v.setColor(colors.get(vDto.getColorId()));
            v.setSize(sizes.get(vDto.getSizeId()));
            v.setPrice(vDto.getPrice());
            v.setQuantityInStock(vDto.getStockLevel());
            v.setImageUrl(vDto.getImageUrl());
            v.setWeight(vDto.getWeight());
            v.setCreatedBy(user);
            toSave.add(v);
        }
        productVariantRepository.saveAll(toSave);

        // 8. Delete removed variants
        for (ProductVariant old : existing) {
            if (!newSkus.contains(old.getSku())) {
                createVariantHistory(old, user, 'D', groupId);
                productVariantRepository.delete(old);
            }
        }
        productVariantRepository.flush();
    }

    @Transactional
    public void deleteProduct(Integer productId) {
        // Resolve current user
        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String keycloakUserId = jwt.getClaim("sub");
        AppUser user = appUserRepository.findByKeycloakId(UUID.fromString(keycloakUserId))
                .orElseThrow(() -> new RuntimeException("User not found with Keycloak ID: " + keycloakUserId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found #" + productId));

        if (product.getPurchases() > 0) {
            // soft-delete
            createProductHistory(product, user, 'U');
            product.setIsActive(false);
            productRepository.save(product);
        } else {
            // hard-delete
            ProductsHistory ph = createProductHistory(product, user, 'D');
            UUID groupId = ph.getHistoryGroupId();

            List<ProductVariant> existing = productVariantRepository.findByProductId(productId);
            existing.forEach(v -> createVariantHistory(v, user, 'D', groupId));

            productRepository.delete(product);
        }
    }

    @Transactional
    public void rollback(Integer historyId) {
        ProductsHistory ph = productHistoryRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("History not found #" + historyId));
        UUID groupId = ph.getHistoryGroupId();

        // resolve associations
        Category cat = categoryRepository.findById(ph.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        Brand br = brandRepository.findById(ph.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        Material mat = materialRepository.findById(ph.getMaterialId())
                .orElseThrow(() -> new RuntimeException("Material not found"));
        TargetAudience ta = targetAudienceRepository.findById(ph.getTargetAudienceId())
                .orElseThrow(() -> new RuntimeException("TargetAudience not found"));

        if (ph.getOperation() == 'D') {
            // recreate product
            Product restored = productMapper.productHistoryToProduct(ph);
            restored.setCategory(cat);
            restored.setBrand(br);
            restored.setMaterial(mat);
            restored.setTargetAudience(ta);
            productRepository.save(restored);

            // recreate all variants from this group
            productVariantHistoryRepository.findByHistoryGroupId(groupId).forEach(vh -> {
                ProductVariant variant = productMapper.productVariantHistoryToProductVariant(vh);
                variant.setColor(colorRepository.findById(vh.getColorId())
                        .orElseThrow(() -> new RuntimeException("Color not found")));
                variant.setSize(sizeRepository.findById(vh.getSizeId())
                        .orElseThrow(() -> new RuntimeException("Size not found")));
                variant.setProduct(restored);

                productVariantRepository.save(variant);
            });

        } else if (ph.getOperation() == 'U') {
            // revert product fields
            Product existing = productRepository.findById(ph.getProductId())
                    .orElseThrow(() -> new RuntimeException("Active product not found"));
            existing.setCategory(cat);
            existing.setBrand(br);
            existing.setMaterial(mat);
            existing.setTargetAudience(ta);

            productMapper.updateProductHistoryToProduct(existing, ph);
            productRepository.save(existing);

            // delete any current variants not in this history group
            Set<Integer> revertVariantIds = productVariantHistoryRepository
                    .findByHistoryGroupId(groupId).stream()
                    .map(ProductVariantsHistory::getVariantId).collect(Collectors.toSet());
            productVariantRepository.findByProductId(existing.getProductId()).stream()
                    .filter(v -> !revertVariantIds.contains(v.getVariantId()))
                    .forEach(productVariantRepository::delete);

            productVariantHistoryRepository.findByHistoryGroupId(groupId).forEach(vh -> {
                ProductVariant variant = productVariantRepository
                        .findById(vh.getVariantId())
                        .orElse(new ProductVariant());
                productMapper.updateProductVariantHistoryToProductVariant(variant, vh);
                variant.setProduct(existing);
                variant.setColor(colorRepository.findById(vh.getColorId())
                        .orElseThrow(() -> new RuntimeException("Color not found")));
                variant.setSize(sizeRepository.findById(vh.getSizeId())
                        .orElseThrow(() -> new RuntimeException("Size not found")));

                productVariantRepository.save(variant);
            });
        } else {
            throw new IllegalArgumentException("Unsupported operation: " + ph.getOperation());
        }
    }



    public void activeornotactive(Integer productId) {
        productRepository.activeornotactive(productId);
    }

    private ProductsHistory createProductHistory(Product product, AppUser user, char op) {
        ProductsHistory hist = productMapper.toHistory(product);
        hist.setChangedBy(user);
        hist.setOperation(op);
        return productHistoryRepository.save(hist);
    }

    private void createVariantHistory(ProductVariant var, AppUser user, char op, UUID groupId) {
        ProductVariantsHistory vh = productMapper.toVariantsHistory(var);
        vh.setChangedBy(user);
        vh.setOperation(op);
        vh.setHistoryGroupId(groupId);
        productVariantHistoryRepository.save(vh);
    }

    private String generateUniqueSku(Integer productId) {
        String sku;
        do {
            sku = "SKU-" + productId + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } while (productVariantRepository.existsBySku(sku));
        return sku;
    }
}