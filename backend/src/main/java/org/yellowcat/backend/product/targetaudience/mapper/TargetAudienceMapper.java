package org.yellowcat.backend.product.targetaudience.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.yellowcat.backend.product.targetaudience.TargetAudience;
import org.yellowcat.backend.product.targetaudience.dto.TargetAudienceCreateDto;
import org.yellowcat.backend.product.targetaudience.dto.TargetAudienceRequestDto;
import org.yellowcat.backend.product.targetaudience.dto.TargetAudienceResponse;

@Mapper(componentModel = "spring")
public interface TargetAudienceMapper {
    TargetAudienceResponse toResponse(TargetAudience targetAudience);

    TargetAudience toEntity(TargetAudienceCreateDto targetAudienceCreateDto);

    @Mapping(target = "id", ignore = true)
    void updateTargetAudience(@MappingTarget TargetAudience targetAudience, TargetAudienceRequestDto targetAudienceRequestDto);
}