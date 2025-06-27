package org.yellowcat.backend.product.productvariant;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantDetailDTO;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantFilterDTO;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantHistoryDto;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantListResponse;
import org.yellowcat.backend.product.productvariant.mapper.ProductVariantMapper;
import org.yellowcat.backend.product.productvariant.specification.ProductVariantSpecification;
import org.yellowcat.backend.product.promotionproduct.dto.ProductVariantSelectionResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductVariantService {
    private final ProductVariantRepository productVariantRepository;
    private final ProductVariantMapper productVariantMapper;
    private final ProductVariantHistoryRepository historyRepository;

    public List<ProductVariantHistoryDto> getHistory(int variantId) {
        return historyRepository.findByVariantId(variantId);
    }

    @Transactional
    public void rollback(int historyId) {
        historyRepository.rollbackToHistory(historyId);
    }

    @Transactional(readOnly = true)
    public Page<ProductVariantFilterDTO> searchPaged(
            String name,
            Long categoryId,
            Long brandId,
            Long materialId,
            Long targetAudienceId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Long colorId,
            Long sizeId,
            int page,
            int size
    ) {
        var spec = ProductVariantSpecification.filter(
                name, categoryId, brandId, materialId,
                targetAudienceId, minPrice, maxPrice, colorId, sizeId
        );

        Pageable pageable = PageRequest.of(page, size);
        return productVariantRepository.findAll(spec, pageable)
                .map(productVariantMapper::toFilterDto);
    }

    @Transactional(readOnly = true)
    public List<ProductVariantFilterDTO> search(
            String name,
            Long categoryId,
            Long brandId,
            Long materialId,
            Long targetAudienceId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Long colorId,
            Long sizeId
    ) {
        var spec = ProductVariantSpecification.filter(
                name, categoryId, brandId, materialId,
                targetAudienceId, minPrice, maxPrice, colorId, sizeId
        );
        var entities = productVariantRepository.findAll(spec);
        return productVariantMapper.toFilterDtoList(entities);
    }

    public Page<ProductVariantListResponse> findAllProductVariant(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        int pageSize = pageable.getPageSize();
        int offset = (int) pageable.getOffset();

        List<ProductVariantListResponse> productDTOs = productVariantRepository.findAllProductVariant(pageSize, offset);
        long totalProducts = productVariantRepository.countTotalProductVariants();

        return new PageImpl<>(productDTOs, pageable, totalProducts);
    }
//    public List<ProductVariantSelectionResponse> getAllVariantsForSelection() {
//        return productVariantRepository.getAllVariantWithProductName();
//    }

    public Page<ProductVariantSelectionResponse> getAllVariantsForSelection(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productVariantRepository.searchVariantsByKeyword(keyword, pageable);
    }

//    public List<ProductVariantDetailDTO> getVariantDetailsByIds(List<Integer> ids) {
//        return productVariantRepository.findDetailsByVariantIds(ids);
//    }

    public List<ProductVariantDetailDTO> getVariantDetailsByIds(List<Integer> ids) {
        return productVariantRepository.findDetailsByVariantIds(ids);
    }


}
