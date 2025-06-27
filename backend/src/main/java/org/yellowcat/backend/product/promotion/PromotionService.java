package org.yellowcat.backend.product.promotion;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.promotion.dto.CreatePromotionDTO;
import org.yellowcat.backend.product.promotion.dto.PromotionRequest;
import org.yellowcat.backend.product.promotion.dto.PromotionResponse;
import org.yellowcat.backend.product.promotion.mapper.PromotionMapper;
import org.yellowcat.backend.product.promotionproduct.PromotionProduct;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.util.List;
import java.util.Random;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class PromotionService {
    PromotionRepository promotionRepository;
    PromotionMapper promotionMapper;
    AppUserRepository appUserRepository;

    public Page<PromotionResponse> getAll(Pageable pageable) {
        Page<Promotion> promotions = promotionRepository.findAll(pageable);

        return promotions.map(promotionMapper::toPromotionResponse);
    }

    public PromotionResponse getById(Integer id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Promotion not found"));

        return promotionMapper.toPromotionResponse(promotion);
    }

    public PromotionResponse create(PromotionRequest request) {
        AppUser appUser = appUserRepository.findById(1)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Promotion promotion = promotionMapper.toPromotion(request);
        promotion.setPromotionCode(generatePromotionCode());
        promotion.setAppUser(appUser);
        promotionRepository.save(promotion);

        return promotionMapper.toPromotionResponse(promotion);
    }

    public PromotionResponse update(Integer id, PromotionRequest request) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Promotion not found"));

        promotionMapper.updatePromotionFromRequest(promotion, request);
        promotionRepository.save(promotion);

        return promotionMapper.toPromotionResponse(promotion);
    }

    public Boolean delete(Integer id) {
        if (!promotionRepository.existsById(id)) {
            throw new RuntimeException("Promotion not found");
        }

        promotionRepository.deleteById(id);
        return true;
    }

    private String generatePromotionCode() {
        Random random = new Random();
        int randomNum = 10000 + random.nextInt(90000); // Sinh số ngẫu nhiên 5 chữ số
        return String.format("KM%d", randomNum);
    }


}