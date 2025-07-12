package org.yellowcat.backend.product.promotionorder.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.yellowcat.backend.product.promotionorder.PromotionProgram;
import org.yellowcat.backend.product.promotionorder.dto.PromotionOrderRequest;
import org.yellowcat.backend.product.promotionorder.dto.PromotionProgramDTO;

@Mapper(componentModel = "spring")
public interface PromotionOrderMapper {
    @Mapping(target = "createdAt", source = "updatedAt")
    @Mapping(target = "createdBy", source = "createdBy.fullName")
    @Mapping(target = "updatedBy", source = "updatedBy.fullName")
    PromotionProgramDTO toDTO(PromotionProgram promotionProgram);

    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "promotionCode", ignore = true)
    PromotionProgram toEntity(PromotionOrderRequest promotionOrderRequest);

    void updateEntityFromRequest(@MappingTarget PromotionProgram promotionProgram, PromotionOrderRequest promotionOrderRequest);
}
