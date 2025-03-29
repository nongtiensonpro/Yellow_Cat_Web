package org.yellowcat.backend.product.brand;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.yellowcat.backend.product.brand.dto.BrandDTO;
import org.yellowcat.backend.product.brand.dto.BrandResponseDTO;
import org.yellowcat.backend.product.brand.dto.CreateBrandRequest;
import org.yellowcat.backend.product.brand.dto.UpdateBrandRequest;

@Mapper(componentModel = "spring")
public interface BrandMapper {
    // Brand to DTO mappings
    BrandDTO toDto(Brand brand);
    
    @Mapping(target = "links", ignore = true)
    BrandResponseDTO toResponseDto(Brand brand);

    // Request to Entity mappings
    @Mapping(target = "brandId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Brand toEntity(CreateBrandRequest request);

    @Mapping(target = "brandId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromDto(UpdateBrandRequest request, @MappingTarget Brand brand);
}