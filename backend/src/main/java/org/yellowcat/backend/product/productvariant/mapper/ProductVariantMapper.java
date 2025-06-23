package org.yellowcat.backend.product.productvariant.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantFilterDTO;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductVariantMapper {
    @Mapping(target = "productId", source = "product.productId")
    @Mapping(target = "productName", source = "product.productName")
    @Mapping(target = "description", source = "product.description")
    @Mapping(target = "category", source = "product.category.name")
    @Mapping(target = "brand", source = "product.brand.brandName")
    @Mapping(target = "material", source = "product.material.name")
    @Mapping(target = "targetAudience", source = "product.targetAudience.name")
    @Mapping(target = "color", source = "color.name")
    @Mapping(target = "size", source = "size.name")
    ProductVariantFilterDTO toFilterDto(ProductVariant productVariant);

    List<ProductVariantFilterDTO> toFilterDtoList(List<ProductVariant> productVariants);
}
