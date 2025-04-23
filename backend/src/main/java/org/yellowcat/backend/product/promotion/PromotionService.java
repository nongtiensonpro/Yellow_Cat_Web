package org.yellowcat.backend.product.promotion;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.promotion.dto.PromotionRequest;
import org.yellowcat.backend.product.promotion.dto.PromotionResponse;
import org.yellowcat.backend.product.promotion.mapper.PromotionMapper;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class PromotionService {
    PromotionRepository promotionRepository;
    PromotionMapper promotionMapper;

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
        Promotion promotion = promotionMapper.toPromotion(request);
        promotionRepository.save(promotion);

        return promotionMapper.toPromotionResponse(promotion);
    }

    public PromotionResponse update(Integer id, PromotionRequest request) {
        Promotion promotion = promotionMapper.toPromotion(request);
        promotion.setId(id);
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
}
