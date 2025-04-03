package org.yellowcat.backend.product.category;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.category.dto.CategoryRequestDto;
import org.yellowcat.backend.product.category.dto.CategoryResponseDto;
import org.yellowcat.backend.product.category.mapper.CategoryMapper;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryService {
     CategoryRepository categoryRepository;
     CategoryMapper categoryMapper;

    public Page<CategoryResponseDto> getAllCategories(Pageable pageable) {
        Page<Category> categories = categoryRepository.findAll(pageable);
        return categories.map(categoryMapper::categoryToCategoryDto);
    }

    public CategoryResponseDto getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id).orElse(null);
        return categoryMapper.categoryToCategoryDto(category);
    }

    public boolean deleteCategory(Integer id) {
        if (categoryRepository.existsById(id)) {
            categoryRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public CategoryResponseDto addCategory(CategoryRequestDto categoryRequestDto) {
        Category category = categoryMapper.categoryRequestDtoToCategory(categoryRequestDto);
        categoryRepository.save(category);
        return categoryMapper.categoryToCategoryDto(category);
    }

    public CategoryResponseDto updateCategory(Integer id, CategoryRequestDto categoryRequestDto) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category != null) {
            category.setName(categoryRequestDto.getName());
            categoryRepository.save(category);
            return categoryMapper.categoryToCategoryDto(category);
        }
        return null;
    }
}