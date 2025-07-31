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
import org.yellowcat.backend.product.productvariant.ProductVariantAutoPromotionService;
import org.yellowcat.backend.product.size.Size;
import org.yellowcat.backend.product.size.SizeRepository;
import org.yellowcat.backend.product.targetaudience.TargetAudience;
import org.yellowcat.backend.product.targetaudience.TargetAudienceRepository;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;
import org.yellowcat.backend.product.dto.VariantPromoItemDTO;
import org.yellowcat.backend.product.dto.VariantPromosDTO;

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
    private final ProductVariantAutoPromotionService autoPromotionService;

    public List<ProductListItemDTO> getLowStockProducts(int threshold) {
        return productRepository.findLowStockProducts(threshold);
    }


    public List<ProductListItemDTO> getTop5BestSellingProducts() {
        return productRepository.findTop5BestSellingProducts();
    }
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
                variantDTO.setPrice((BigDecimal) row[18]);
                variantDTO.setSalePrice((BigDecimal) row[19]);
                variantDTO.setStockLevel((Integer) row[20]);
                variantDTO.setSold((Integer) row[21]);
                variantDTO.setImageUrl((String) row[22]);
                variantDTO.setWeight((Double) row[23]);
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

            // Tự động sinh SKU dựa trên tên sản phẩm, màu sắc và size
            String sku = generateProfessionalSku(product.getProductId(), color.getId(), size.getId());
            variant.setSku(sku);

            variant.setColor(color);
            variant.setSize(size);
            variant.setPrice(variantDto.getPrice());
            // Không set salePrice từ DTO nữa, sẽ để auto-promotion service xử lý
            variant.setQuantityInStock(variantDto.getStockLevel());
            variant.setSold(variantDto.getSold() != null ? variantDto.getSold() : 0);
            variant.setImageUrl(variantDto.getImageUrl());
            variant.setWeight(variantDto.getWeight());
            variant.setCreatedBy(appUser);
            
            // Lưu variant trước để có ID
            variant = productVariantRepository.save(variant);
            
            // 🔥 TỰ ĐỘNG ÁP DỤNG PROMOTION (nếu có)
            boolean promotionApplied = autoPromotionService.autoApplyBestPromotion(variant);
            if (promotionApplied) {
                productVariantRepository.save(variant); // Save lại nếu có thay đổi salePrice
            }
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
        Map<Integer, ProductVariant> existingMap = existing.stream()
                .filter(v -> v.getVariantId() != null)
                .collect(Collectors.toMap(ProductVariant::getVariantId, v -> v));

        Set<Integer> processedVariantIds = new HashSet<>();
        List<ProductVariant> toSave = new ArrayList<>();

        // 7. Process new & updated variants
        for (var vDto : dto.getVariants()) {
            ProductVariant v;
            boolean isNewVariant = (vDto.getVariantId() == null);
            
            if (isNewVariant) {
                // Tạo variant mới
                v = new ProductVariant();
                v.setProduct(product);
                v.setCreatedBy(user);
                
                // Tự động sinh SKU cho variant mới
                Color variantColor = colors.get(vDto.getColorId());
                Size variantSize = sizes.get(vDto.getSizeId());
                String autoSku = generateProfessionalSku(product.getProductId(), variantColor.getId(), variantSize.getId());
                v.setSku(autoSku);
            } else {
                // Cập nhật variant hiện có
                v = existingMap.get(vDto.getVariantId());
                if (v == null) {
                    throw new RuntimeException("Variant not found with ID: " + vDto.getVariantId());
                }
                processedVariantIds.add(vDto.getVariantId());
                
                // History before update
                createVariantHistory(v, user, 'U', groupId);
                
                // Giữ nguyên SKU hiện tại hoặc generate lại nếu color/size thay đổi
                boolean colorChanged = !v.getColor().getId().equals(vDto.getColorId());
                boolean sizeChanged = !v.getSize().getId().equals(vDto.getSizeId());
                
                if (colorChanged || sizeChanged) {
                    Color variantColor = colors.get(vDto.getColorId());
                    Size variantSize = sizes.get(vDto.getSizeId());
                    String newSku = generateProfessionalSku(product.getProductId(), variantColor.getId(), variantSize.getId());
                    v.setSku(newSku);
                }
            }
            
            v.setColor(colors.get(vDto.getColorId()));
            v.setSize(sizes.get(vDto.getSizeId()));
            v.setPrice(vDto.getPrice());
            // Không set salePrice từ DTO nữa, sẽ để auto-promotion service xử lý
            v.setQuantityInStock(vDto.getStockLevel());
            v.setSold(vDto.getSold() != null ? vDto.getSold() : 0);
            v.setImageUrl(vDto.getImageUrl());
            v.setWeight(vDto.getWeight());
            
            // 🔥 TỰ ĐỘNG ÁP DỤNG PROMOTION (nếu có)
            // Điều này sẽ tự động tính lại salePrice dựa trên promotion đang active
            autoPromotionService.autoApplyBestPromotion(v);
            
            toSave.add(v);
        }
        productVariantRepository.saveAll(toSave);

        // 8. Delete removed variants (những variant không có trong request)
        for (ProductVariant old : existing) {
            if (!processedVariantIds.contains(old.getVariantId())) {
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

    @Transactional
    public Page<ProductHistoryDto> findAllProductHistory(int size, int page) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("changedAt").descending());
        Page<ProductsHistory> historyPage = productHistoryRepository.findAll(pageable);
        List<ProductsHistory> histories = historyPage.getContent();
        if (histories.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, historyPage.getTotalElements());
        }

        // build maps
        Map<Integer, String> categoryMap = categoryRepository.findAllById(
                histories.stream().map(ProductsHistory::getCategoryId)
                        .filter(Objects::nonNull).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Category::getId, Category::getName));

        Map<Integer, String> brandMap = brandRepository.findAllById(
                histories.stream().map(ProductsHistory::getBrandId)
                        .filter(Objects::nonNull).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Brand::getId, Brand::getBrandName));

        Map<Integer, String> materialMap = materialRepository.findAllById(
                histories.stream().map(ProductsHistory::getMaterialId)
                        .filter(Objects::nonNull).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Material::getId, Material::getName));

        Map<Integer, String> targetAudienceMap = targetAudienceRepository.findAllById(
                histories.stream().map(ProductsHistory::getTargetAudienceId)
                        .filter(Objects::nonNull).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(TargetAudience::getId, TargetAudience::getName));

        NameMaps maps = new NameMaps(categoryMap, brandMap, materialMap, targetAudienceMap);

        List<ProductHistoryDto> dtos = histories.stream()
                .map(h -> productMapper.toProductHistoryDto(h, maps))
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, historyPage.getTotalElements());
    }

    public Page<ProductVariantHistoryDTO> findAllByHistoryGroupId(
            UUID historyGroupId,
            int size,
            int page
    ) {
        // 1. Tạo pageable với sort by changedAt desc
        Pageable pageable = PageRequest.of(page, size, Sort.by("changedAt").descending());

        // 2. Lấy page của history
        Page<ProductVariantsHistory> historyPage =
                productVariantHistoryRepository.findAllByHistoryGroupId(historyGroupId, pageable);
        List<ProductVariantsHistory> histories = historyPage.getContent();

        if (histories.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(),
                    pageable,
                    historyPage.getTotalElements());
        }

        // 3. Thu thập tất cả colorId và sizeId
        Set<Integer> colorIds = histories.stream()
                .map(ProductVariantsHistory::getColorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Integer> sizeIds = histories.stream()
                .map(ProductVariantsHistory::getSizeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 4. Load tên color & size 1 lần và build map
        Map<Integer, String> colorMap = colorRepository.findAllById(colorIds).stream()
                .collect(Collectors.toMap(Color::getId, Color::getName));
        Map<Integer, String> sizeMap = sizeRepository.findAllById(sizeIds).stream()
                .collect(Collectors.toMap(Size::getId, Size::getName));

        // 5. Map vào DTO
        List<ProductVariantHistoryDTO> dtos = histories.stream()
                .map(h -> {
                    ProductVariantHistoryDTO dto = new ProductVariantHistoryDTO();
                    dto.setHistoryId(h.getHistoryId());
                    dto.setHistoryGroupId(h.getHistoryGroupId());
                    dto.setSku(h.getSku());
                    dto.setColor(colorMap.get(h.getColorId()));
                    dto.setSize(sizeMap.get(h.getSizeId()));
                    dto.setQuantityInStock(h.getQuantityInStock());
                    dto.setImageUrl(h.getImageUrl());
                    dto.setWeight(h.getWeight());
                    dto.setOperation(h.getOperation().toString());
                    dto.setChangedAt(h.getChangedAt());
                    dto.setChangedBy(h.getChangedBy().getEmail());
                    return dto;
                })
                .collect(Collectors.toList());

        // 6. Trả về PageImpl
        return new PageImpl<>(
                dtos,
                pageable,
                historyPage.getTotalElements()
        );
    }

    public void activeornotactive(Integer productId) {
        productRepository.activeornotactive(productId);
    }

    // ----------------------- Khuyến mãi cho variant -----------------------
    public VariantPromosDTO getVariantPromotions(Integer variantId) {
        List<Object[]> rows = productRepository.findVariantPromotions(variantId);
        VariantPromosDTO result = new VariantPromosDTO();
        List<VariantPromoItemDTO> usable = new ArrayList<>();

        for (Object[] r : rows) {
            VariantPromoItemDTO item = new VariantPromoItemDTO();
            item.setPromotionCode((String) r[0]);
            item.setPromotionName((String) r[1]);
            item.setDescription((String) r[2]);
            item.setDiscountAmount((java.math.BigDecimal) r[3]);
            item.setFinalPrice((java.math.BigDecimal) r[4]);
            
            // Transform discount type to match frontend expectations
            String discountType = (String) r[5];
            if ("percentage".equalsIgnoreCase(discountType)) {
                item.setDiscountType("PERCENTAGE");
            } else if ("fixed_amount".equalsIgnoreCase(discountType) || "VNĐ".equalsIgnoreCase(discountType)) {
                item.setDiscountType("FIXED_AMOUNT");
            } else {
                item.setDiscountType(discountType != null ? discountType.toUpperCase() : "FIXED_AMOUNT");
            }
            
            item.setDiscountValue((java.math.BigDecimal) r[6]);
            
            // Convert Timestamp to LocalDateTime
            if (r[7] != null) {
                item.setStartDate(((java.sql.Timestamp) r[7]).toLocalDateTime());
            }
            if (r[8] != null) {
                item.setEndDate(((java.sql.Timestamp) r[8]).toLocalDateTime());
            }
            
            item.setIsActive((Boolean) r[9]);
            Boolean isBest = (Boolean) r[10];
            if (Boolean.TRUE.equals(isBest) && result.getBestPromo() == null) {
                result.setBestPromo(item);
            }
            usable.add(item);
        }
        result.setUsablePromos(usable);
        return result;
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

    /**
     * Tạo SKU chuyên nghiệp dựa trên ID thay vì tên tiếng Việt
     * Format: P{ProductID}-C{ColorID}-S{SizeID}
     * Ví dụ: P123-C5-S2, P123-C5-S2-01 (nếu trùng)
     */
    private String generateProfessionalSku(Integer productId, Integer colorId, Integer sizeId) {
        String baseSku = String.format("P%d-C%d-S%d", productId, colorId, sizeId);
        
        // Kiểm tra unique và thêm suffix nếu cần
        String finalSku = baseSku;
        int counter = 1;
        while (productVariantRepository.existsBySku(finalSku)) {
            finalSku = baseSku + "-" + String.format("%02d", counter);
            counter++;
        }
        
        return finalSku;
    }
}