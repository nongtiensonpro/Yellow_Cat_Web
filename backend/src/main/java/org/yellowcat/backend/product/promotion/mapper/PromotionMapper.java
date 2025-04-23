package org.yellowcat.backend.product.promotion.mapper;

import org.mapstruct.Mapper;
import org.yellowcat.backend.product.promotion.Promotion;
import org.yellowcat.backend.product.promotion.dto.PromotionRequest;
import org.yellowcat.backend.product.promotion.dto.PromotionResponse;

@Mapper(componentModel = "spring")
public interface PromotionMapper {
    Promotion toPromotion(PromotionRequest request);

    PromotionResponse toPromotionResponse(Promotion promotion);
}
