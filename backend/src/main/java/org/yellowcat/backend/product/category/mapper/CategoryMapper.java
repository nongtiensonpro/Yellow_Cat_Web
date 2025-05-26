package org.yellowcat.backend.product.category.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.yellowcat.backend.product.category.Category;
import org.yellowcat.backend.product.category.dto.CategoryCreateDto;
import org.yellowcat.backend.product.category.dto.CategoryRequestDto;
import org.yellowcat.backend.product.category.dto.CategoryResponse;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    CategoryResponse categoryToCategoryDto(Category category);

    Category categoryRequestDtoToCategory(CategoryCreateDto categoryCreateDto);

    void updateCategory(@MappingTarget Category category, CategoryRequestDto categoryRequestDto);
}