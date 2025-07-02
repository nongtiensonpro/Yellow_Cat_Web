package org.yellowcat.backend.product.dto;

import org.mapstruct.*;
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.ProductVariantsHistory;
import org.yellowcat.backend.product.ProductsHistory;
import org.yellowcat.backend.product.productvariant.ProductVariant;


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

    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "brandId", source = "brand.id")
    @Mapping(target = "materialId", source = "material.id")
    @Mapping(target = "targetAudienceId", source = "targetAudience.id")
    @Mapping(target = "historyGroupId", ignore = true) // DB tự sinh
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ProductsHistory toHistory(Product product);

    @Mapping(target = "colorId", source = "color.id")
    @Mapping(target = "sizeId", source = "size.id")
    @Mapping(target = "historyGroupId", ignore = true)
    @Mapping(target = "productId", source = "product.productId")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ProductVariantsHistory toVariantsHistory(ProductVariant variant);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "productId", ignore = true)
    Product productHistoryToProduct(ProductsHistory history);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "variantId", ignore = true)
    ProductVariant productVariantHistoryToProductVariant(ProductVariantsHistory history);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateProductHistoryToProduct(@MappingTarget Product product, ProductsHistory history);


    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "variantId", ignore = true)
    void updateProductVariantHistoryToProductVariant(
            @MappingTarget ProductVariant variant,
            ProductVariantsHistory history
    );
}