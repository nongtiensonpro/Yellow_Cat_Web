package org.yellowcat.backend.product.category;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.common.websocket.EntityMessage;
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.ProductRepository;
import org.yellowcat.backend.product.category.dto.CategoryCreateDto;
import org.yellowcat.backend.product.category.dto.CategoryRequestDto;
import org.yellowcat.backend.product.category.dto.CategoryResponse;
import org.yellowcat.backend.product.category.mapper.CategoryMapper;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryService {
    CategoryRepository categoryRepository;
    ProductRepository productRepository;
    CategoryMapper categoryMapper;
    SimpMessagingTemplate messagingTemplate;

    public Page<CategoryResponse> getAllCategories(int page, int size) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Category> categories = categoryRepository.findAll(pageable);
        return categories.map(categoryMapper::categoryToCategoryDto);
    }

    public CategoryResponse getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id).orElse(null);
        return categoryMapper.categoryToCategoryDto(category);
    }

    public boolean deleteCategory(Integer id) {
        if (categoryRepository.existsById(id)) {
            Category category = categoryRepository.findById(id).orElse(null);
            List<Product> products = productRepository.findByCategoryId(id);
            if (!products.isEmpty() && category != null) {
                category.setStatus(false);
                categoryRepository.save(category);

                return false;
            }

            messagingTemplate.convertAndSend("/topic/categories", new EntityMessage("Category deleted: ", getCategoryById(id)));
            categoryRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public CategoryResponse addCategory(CategoryCreateDto request) {
        Category category = categoryMapper.categoryRequestDtoToCategory(request);
        Category savedCategory = categoryRepository.save(category);
        messagingTemplate.convertAndSend("/topic/categories", new EntityMessage("add", categoryMapper.categoryToCategoryDto(savedCategory)));
        return categoryMapper.categoryToCategoryDto(savedCategory);
    }

    public CategoryResponse updateCategory(Integer id, CategoryRequestDto request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + request.getId()));

        categoryMapper.updateCategory(category, request);
        categoryRepository.save(category);
        messagingTemplate.convertAndSend("/topic/categories", new EntityMessage("Category updated: ", category));
        return categoryMapper.categoryToCategoryDto(category);
    }

    public boolean updateStatus(Integer id) {
        if (categoryRepository.existsById(id)) {
            Category category = categoryRepository.findById(id).orElse(null);
            if (category != null) {
                category.setStatus(!category.getStatus());
                categoryRepository.save(category);

                return true;
            }
        }
        return false;
    }
}