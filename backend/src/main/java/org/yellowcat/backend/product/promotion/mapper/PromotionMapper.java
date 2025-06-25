package org.yellowcat.backend.product.promotion.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.yellowcat.backend.product.promotion.Promotion;
import org.yellowcat.backend.product.promotion.dto.PromotionRequest;
import org.yellowcat.backend.product.promotion.dto.PromotionResponse;

@Mapper(componentModel = "spring")
public interface PromotionMapper {
    Promotion toPromotion(PromotionRequest request);

    @Mapping(target = "createBy", source = "appUser.fullName")
    PromotionResponse toPromotionResponse(Promotion promotion);

    @Mapping(target = "id", ignore = true)
    void updatePromotionFromRequest(@MappingTarget Promotion promotion, PromotionRequest request);
}


