package org.yellowcat.backend.product.category.mapper;

import org.mapstruct.Mapper;
import org.yellowcat.backend.product.category.Category;
import org.yellowcat.backend.product.category.dto.CategoryCreateDto;
import org.yellowcat.backend.product.category.dto.CategoryRequestDto;
import org.yellowcat.backend.product.category.dto.CategoryResponseDto;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    CategoryResponseDto categoryToCategoryDto(Category category);

    Category categoryRequestDtoToCategory(CategoryCreateDto categoryCreateDto);
}