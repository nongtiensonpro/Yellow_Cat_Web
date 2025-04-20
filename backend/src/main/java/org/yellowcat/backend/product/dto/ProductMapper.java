package org.yellowcat.backend.product.dto;

import org.mapstruct.*;
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.brand.dto.BrandSummaryDto;
import org.yellowcat.backend.product.category.dto.CategorySummaryDto;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = MappingConstants.ComponentModel.SPRING)
public interface ProductMapper {

    @Mapping(target = "category.id", source = "category.id")
    @Mapping(target = "brand.id", source = "brand.id")
    // Add mappings to ignore fields not present in summary DTOs if needed
    // @Mapping(target = "category.name", ignore = true) // Example if needed
    // @Mapping(target = "brand.brandName", ignore = true) // Example if needed
    Product toEntity(ProductDto productDto);

    @Mapping(target = "category.id", source = "category.id")
    @Mapping(target = "category.name", source = "category.name")
    @Mapping(target = "brand.id", source = "brand.id")
    @Mapping(target = "brand.brandName", source = "brand.brandName")
    ProductDto toDto(Product product);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "category.id", source = "category.id")
    @Mapping(target = "brand.id", source = "brand.id")
    // Add mappings to ignore fields not present in summary DTOs if needed
    Product partialUpdate(ProductDto productDto, @MappingTarget Product product);
}