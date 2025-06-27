// Service: PromotionProductService.java
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
import org.yellowcat.backend.product.promotionproduct.dto.PromotionProductRequest;
import org.yellowcat.backend.product.promotionproduct.dto.PromotionProductResponse;
import org.yellowcat.backend.user.AppUser;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class PromotionProductService {

    PromotionProductRepository promotionProductRepository;
    PromotionRepository promotionRepository;
    ProductVariantRepository productVariantRepository;

    public List<PromotionProductResponse> getAllWithJoin() {
        return promotionProductRepository.findAllWithJoin();
    }

    public PromotionProductResponse create(PromotionProductRequest request) {
        Promotion promotion = promotionRepository.findById(request.getPromotionId())
                .orElseThrow(() -> new EntityNotFoundException("Promotion not found"));
        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new EntityNotFoundException("ProductVariant not found"));

        PromotionProduct entity = promotionProductRepository.save(PromotionProduct.builder()
                .promotion(promotion)
                .productVariant(variant)
                .build());

        return promotionProductRepository.findByIdWithJoin(entity.getPromotionProductId())
                .orElseThrow(() -> new EntityNotFoundException("Created entity not found"));
    }



    public void delete(Integer id) {
        if (!promotionProductRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy khuyến mãi với id = " + id);
        }
        promotionProductRepository.deleteById(id);
    }

    public List<PromotionProductResponse> getFiltered(String keyword, String status, Double discountValue) {
        return promotionProductRepository.findAllWithFilters(keyword, status, discountValue);
    }
    @Transactional
    public void createPromotionWithProducts(CreatePromotionDTO dto) {
        Promotion promotion = new Promotion();
        promotion.setPromotionName(dto.getPromotionName());
        promotion.setDiscountValue(dto.getDiscountValue());
        promotion.setStartDate(dto.getStartDate());
        promotion.setEndDate(dto.getEndDate());
        promotion = promotionRepository.save(promotion);

        List<ProductVariant> variants = productVariantRepository.findAllById(dto.getProductIds());

        for (ProductVariant variant : variants) {
            PromotionProduct pp = new PromotionProduct();
            pp.setPromotion(promotion);
            pp.setProductVariant(variant);
            promotionProductRepository.save(pp);
        }
    }

    public List<ProductVariantSelectionResponse> getAllVariantsForSelection(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return promotionProductRepository.findAllVariantsWithProductName();
        } else {
            return promotionProductRepository.searchVariantsByKeyword(keyword.toLowerCase());
        }
    }



}