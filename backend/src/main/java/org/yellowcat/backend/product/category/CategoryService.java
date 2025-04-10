package org.yellowcat.backend.product.category;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.config.EntityMessage;
import org.yellowcat.backend.product.category.dto.CategoryCreateDto;
import org.yellowcat.backend.product.category.dto.CategoryRequestDto;
import org.yellowcat.backend.product.category.dto.CategoryResponseDto;
import org.yellowcat.backend.product.category.mapper.CategoryMapper;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryService {
     CategoryRepository categoryRepository;
     CategoryMapper categoryMapper;
     SimpMessagingTemplate messagingTemplate;

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
            messagingTemplate.convertAndSend("/topic/categories", new EntityMessage("Category deleted: ",getCategoryById(id)));
            categoryRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public CategoryResponseDto addCategory(CategoryCreateDto categoryCreateDto) {
        Category category = categoryMapper.categoryRequestDtoToCategory(categoryCreateDto);
        Category savedCategory = categoryRepository.save(category);
        messagingTemplate.convertAndSend("/topic/categories", new EntityMessage("add", categoryMapper.categoryToCategoryDto(savedCategory)));
        return categoryMapper.categoryToCategoryDto(savedCategory);
    }

    public CategoryResponseDto updateCategory(Integer id, CategoryRequestDto categoryRequestDto) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category != null) {
            category.setName(categoryRequestDto.getName());
            categoryRepository.save(category);
            messagingTemplate.convertAndSend("/topic/categories", new EntityMessage("Category updated: ", category));
            return categoryMapper.categoryToCategoryDto(category);
        }
        return null;
    }
}

