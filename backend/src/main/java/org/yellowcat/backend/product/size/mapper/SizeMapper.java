package org.yellowcat.backend.product.size.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.yellowcat.backend.product.size.Size;
import org.yellowcat.backend.product.size.dto.SizeCreateDto;
import org.yellowcat.backend.product.size.dto.SizeRequestDto;
import org.yellowcat.backend.product.size.dto.SizeResponse;

@Mapper(componentModel = "spring")
public interface SizeMapper {
    SizeResponse toResponse(Size size);

    Size toEntity(SizeCreateDto sizeCreateDto);

    @Mapping(target = "id", ignore = true)
    void updateSize(@MappingTarget Size size, SizeRequestDto sizeRequestDto);
}