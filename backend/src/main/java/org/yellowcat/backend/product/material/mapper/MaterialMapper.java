package org.yellowcat.backend.product.material.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.yellowcat.backend.product.material.Material;
import org.yellowcat.backend.product.material.dto.MaterialCreateDto;
import org.yellowcat.backend.product.material.dto.MaterialRequestDto;
import org.yellowcat.backend.product.material.dto.MaterialResponse;

@Mapper(componentModel = "spring")
public interface MaterialMapper {
    MaterialResponse toResponse(Material material);

    Material toEntity(MaterialCreateDto materialCreateDto);

    @Mapping(target = "id", ignore = true)
    void updateMaterial(@MappingTarget Material material, MaterialRequestDto materialRequestDto);
}