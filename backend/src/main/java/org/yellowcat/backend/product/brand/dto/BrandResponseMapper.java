package org.yellowcat.backend.product.brand.dto;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.yellowcat.backend.product.brand.Brand;
import org.yellowcat.backend.product.brand.dto.BrandResponseDTO;

@Mapper(componentModel = "spring")
public interface BrandResponseMapper {
    @Mapping(target = "links", ignore = true)
    BrandResponseDTO toResponseDto(Brand brand);
}