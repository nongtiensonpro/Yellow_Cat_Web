package org.yellowcat.backend.product.color.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.yellowcat.backend.product.color.Color;
import org.yellowcat.backend.product.color.dto.ColorCreateDto;
import org.yellowcat.backend.product.color.dto.ColorRequestDto;
import org.yellowcat.backend.product.color.dto.ColorResponse;

@Mapper(componentModel = "spring")
public interface ColorMapper {
    ColorResponse toResponse(Color color);

    Color toEntity(ColorCreateDto colorCreateDto);

    @Mapping(target = "id", ignore = true)
    void updateColor(@MappingTarget Color color, ColorRequestDto colorRequestDto);
}