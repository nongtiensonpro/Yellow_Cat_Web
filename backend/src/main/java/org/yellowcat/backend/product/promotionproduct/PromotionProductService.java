
package org.yellowcat.backend.product.promotionproduct;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.product.promotion.Promotion;
import org.yellowcat.backend.product.promotion.PromotionRepository;
import org.yellowcat.backend.product.promotion.dto.CreatePromotionDTO;
import org.yellowcat.backend.product.promotionproduct.dto.ProductVariantSelectionResponse;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionEditResponse;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionSummaryResponse;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class PromotionProductService {

    PromotionProductRepository promotionProductRepository;
    PromotionRepository promotionRepository;
    ProductVariantRepository productVariantRepository;
    AppUserRepository appUserRepository;

    private String normalizeName(String name) {
        return name == null ? "" : name.trim().toLowerCase();
    }


    // ✅ LẤY TẤT CẢ KÈM JOIN
    public List<PromotionProductResponse> getAllWithJoin() {
        return promotionProductRepository.findAllWithJoin();
    }

    // ✅ LẤY 1 ITEM BY ID
    public PromotionProductResponse getById(Integer id) {
        return promotionProductRepository.findByIdWithJoin(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đợt giảm giá với ID: " + id));
    }


    public List<PromotionProductResponse> getFiltered(String keyword, String status, String discountType, Double discountValue, LocalDate startDateFilter, LocalDate endDateFilter) {
        return promotionProductRepository.findAllWithFilters(keyword, status, discountType, discountValue, startDateFilter, endDateFilter);
    }

    // ✅ GET VARIANTS CHO SELECT
    public List<ProductVariantSelectionResponse> getAllVariantsForSelection(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return promotionProductRepository.findAllVariantsWithProductName();
        } else {
            return promotionProductRepository.searchVariantsByKeyword(keyword.toLowerCase());
        }
    }

    // ✅ GET ĐỂ EDIT
    public PromotionEditResponse getPromotionForEdit(Integer promotionProductId) {
        PromotionProduct promotionProduct = promotionProductRepository.findById(promotionProductId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đợt giảm giá với ID: " + promotionProductId));

        Promotion promotion = promotionProduct.getPromotion();

        List<Integer> variantIds = promotionProductRepository.findVariantIdsByPromotionId(promotion.getId());

        return new PromotionEditResponse(
                promotion.getId(),
                promotion.getPromotionName(),
                promotion.getDescription(),
                promotion.getDiscountType(),
                promotion.getDiscountValue(),
                promotion.getStartDate(),
                promotion.getEndDate(),
                promotion.getIsActive(),
                variantIds
        );
    }

    // ✅ TÓM TẮT CHỈ 1 BẢN GHI/ PROMOTION
    public List<PromotionSummaryResponse> getPromotionSummaries() {
        return promotionProductRepository.findDistinctPromotions();
    }


    @Transactional
    public void createPromotionWithProducts(CreatePromotionDTO dto, UUID userId) {
        // ====== NEW VALIDATION: Không cho trùng khuyến mãi cùng thời gian ======
        List<String> conflictingSkus = promotionProductRepository.findConflictingSkus(
                dto.getVariantIds(),
                dto.getStartDate(),
                dto.getEndDate()
        );
        if (!conflictingSkus.isEmpty()) {
            throw new IllegalArgumentException("Các SKU đã thuộc khuyến mãi khác trong khoảng thời gian này: " + String.join(", ", conflictingSkus));
        }

        if (promotionProductRepository.existsByPromotionNameIgnoreCase(dto.getPromotionName())) {
            throw new IllegalArgumentException("Tên đợt giảm giá đã tồn tại");
        }
        String normalizedName = normalizeName(dto.getPromotionName());
        if (promotionProductRepository.existsByPromotionNameIgnoreCase(normalizedName)) {
            throw new IllegalArgumentException("Tên đợt giảm giá đã tồn tại");
        }
        if (normalizedName.matches("^\\d+$")) {
            throw new IllegalArgumentException("Tên đợt giảm giá không thể chỉ chứa số.");
        }
        AppUser user = appUserRepository.findByKeycloakId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Promotion promotion = new Promotion();
        promotion.setPromotionName(dto.getPromotionName());
        promotion.setDescription(dto.getDescription());
        promotion.setPromotionCode(generatePromotionCode());
        promotion.setDiscountValue(dto.getDiscountValue());
        promotion.setDiscountType(dto.getDiscountType() != null ? dto.getDiscountType() : "percentage");
        promotion.setStartDate(dto.getStartDate());
        promotion.setEndDate(dto.getEndDate());
        // Thiết lập trạng thái hoạt động nếu DTO có gửi
        promotion.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        promotion.setAppUser(user);

        promotionRepository.save(promotion);

        List<ProductVariant> variants = productVariantRepository.findAllById(dto.getVariantIds());
        for (ProductVariant variant : variants) {
            PromotionProduct pp = new PromotionProduct();
            pp.setPromotion(promotion);
            pp.setProductVariant(variant);
            promotionProductRepository.save(pp);

            applyDiscountToVariant(variant, dto);
            productVariantRepository.save(variant);
        }
    }

    @Transactional
    public void updatePromotionWithProducts(Integer promotionProductId, CreatePromotionDTO dto, UUID userId) {
        PromotionProduct existingPP = promotionProductRepository.findById(promotionProductId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đợt giảm giá với ID: " + promotionProductId));

        Promotion promotion = existingPP.getPromotion();

        String normalizedName = normalizeName(dto.getPromotionName());
        if (promotionProductRepository.existsByPromotionNameIgnoreCaseAndIdNot(normalizedName, promotion.getId())) {
            throw new IllegalArgumentException("Tên đợt giảm giá đã tồn tại");
        }
        if (normalizedName.matches("^\\d+$")) {
            throw new IllegalArgumentException("Tên đợt giảm giá không thể chỉ chứa số.");
        }

        // ====== NEW VALIDATION: Kiểm tra xung đột với khuyến mãi khác ======
        List<String> conflictingSkus = promotionProductRepository.findConflictingSkusExcludingPromotion(
                dto.getVariantIds(),
                dto.getStartDate(),
                dto.getEndDate(),
                promotion.getId()
        );
        if (!conflictingSkus.isEmpty()) {
            throw new IllegalArgumentException("Các SKU đã thuộc khuyến mãi khác trong khoảng thời gian này: " + String.join(", ", conflictingSkus));
        }

        // Reset salePrice cũ của các sản phẩm liên quan đến đợt khuyến mãi này
        List<Integer> oldVariantIds = promotionProductRepository.findVariantIdsByPromotionId(promotion.getId());
        List<ProductVariant> oldVariants = productVariantRepository.findAllById(oldVariantIds);
        for (ProductVariant oldVar : oldVariants) {
            oldVar.setSalePrice(null);
            productVariantRepository.save(oldVar);
        }

        // Cập nhật thông tin promotion
        promotion.setPromotionName(dto.getPromotionName());
        promotion.setDescription(dto.getDescription());
        promotion.setDiscountValue(dto.getDiscountValue());
        promotion.setDiscountType(dto.getDiscountType() != null ? dto.getDiscountType() : "percentage");
        promotion.setStartDate(dto.getStartDate());
        promotion.setEndDate(dto.getEndDate());

        // --- Bắt đầu sửa đổi logic: Cập nhật trạng thái isActive ---
        boolean newIsActive = dto.getIsActive() != null ? dto.getIsActive() : promotion.getIsActive();
        promotion.setIsActive(newIsActive);
        promotionRepository.save(promotion);

        // Xóa mapping cũ
        promotionProductRepository.deleteByPromotionId(promotion.getId());

        List<ProductVariant> newVariants = productVariantRepository.findAllById(dto.getVariantIds());
        for (ProductVariant variant : newVariants) {
            PromotionProduct pp = new PromotionProduct();
            pp.setPromotion(promotion);
            pp.setProductVariant(variant);
            promotionProductRepository.save(pp);

            // Chỉ áp dụng giảm giá nếu chương trình đang hoạt động
            if (newIsActive) {
                applyDiscountToVariant(variant, dto);
            } else {
                // Nếu không hoạt động, đặt salePrice về null (đã làm ở trên nhưng làm lại cho chắc chắn)
                variant.setSalePrice(null);
            }
            productVariantRepository.save(variant);
        }
        // --- Kết thúc sửa đổi logic ---
    }

    @Transactional
    public void delete(Integer id, UUID userId) {
        // Tìm PromotionProduct ban đầu để lấy Promotion
        PromotionProduct existingPromotionProduct = promotionProductRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đợt giảm giá với ID: " + id));

        Promotion promotion = existingPromotionProduct.getPromotion();

        AppUser user = appUserRepository.findByKeycloakId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!promotion.getAppUser().getAppUserId().equals(user.getAppUserId())) {
            throw new RuntimeException("Bạn không có quyền xóa đợt giảm giá này");
        }

        // Cần đảm bảo rằng danh sách promotionProducts trong đối tượng promotion đã được load
        // Để có thể hoàn tác giá, ta có thể lấy danh sách này trực tiếp từ promotion.getPromotionProducts()
        List<PromotionProduct> promotionProducts = promotion.getPromotionProducts();

        // Hoàn tác giá khuyến mãi trước khi xóa Promotion
        for (PromotionProduct promotionProduct : promotionProducts) {
            ProductVariant variant = promotionProduct.getProductVariant();
            variant.setSalePrice(null);
            productVariantRepository.save(variant);
        }

        // Xóa đối tượng Promotion cha. Hibernate sẽ tự động xóa tất cả PromotionProduct con.
        promotionRepository.delete(promotion);
    }

    // ✅ ÁP GIẢM GIÁ
    private void applyDiscountToVariant(ProductVariant variant, CreatePromotionDTO dto) {
        LocalDateTime now = LocalDateTime.now();

        // Nếu khuyến mãi chưa bắt đầu hoặc đã kết thúc → không áp dụng, salePrice = 0
        if ((dto.getStartDate() != null && dto.getStartDate().isAfter(now)) ||
                (dto.getEndDate() != null && dto.getEndDate().isBefore(now))) {
            variant.setSalePrice(null);
            return;
        }

        // Áp dụng khuyến mãi nếu còn hiệu lực
        if ("percentage".equalsIgnoreCase(dto.getDiscountType())) {
            double discount = dto.getDiscountValue().doubleValue() / 100.0;
            double newPrice = variant.getPrice().doubleValue() * (1.0 - discount);
            variant.setSalePrice(BigDecimal.valueOf(newPrice));
        } else if ("fixed_amount".equalsIgnoreCase(dto.getDiscountType())) {
            double newPrice = variant.getPrice().doubleValue() - dto.getDiscountValue().doubleValue();
            variant.setSalePrice(BigDecimal.valueOf(Math.max(newPrice, 0)));
        } else if ("free_shipping".equalsIgnoreCase(dto.getDiscountType())) {
            // Miễn phí vận chuyển – không thay đổi giá
        }
    }

    // ✅ TẠO CODE
    private String generatePromotionCode() {
        int randomNum = 10000 + new Random().nextInt(90000);
        return "KM" + randomNum;
    }


}
