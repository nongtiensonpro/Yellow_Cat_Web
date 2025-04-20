package org.yellowcat.backend.product.dto;

import org.mapstruct.*;
import org.yellowcat.backend.product.Product;


@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = MappingConstants.ComponentModel.SPRING)
public interface ProductMapper {

    @Mapping(target = "category.id", source = "category.id")
    @Mapping(target = "brand.id", source = "brand.id")
    Product toEntity(ProductDto productDto);

    @Mapping(target = "category.id", source = "category.id")
    @Mapping(target = "category.name", source = "category.name")
    @Mapping(target = "brand.id", source = "brand.id")
    @Mapping(target = "brand.brandName", source = "brand.brandName")
    ProductDto toDto(Product product);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "category.id", source = "category.id")
    @Mapping(target = "brand.id", source = "brand.id")
    Product partialUpdate(ProductDto productDto, @MappingTarget Product product);
}