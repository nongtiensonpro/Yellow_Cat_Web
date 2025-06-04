package org.yellowcat.backend.product.productvariant;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantListResponse;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductVariantService {
    private final ProductVariantRepository productVariantRepository;


    public Page<ProductVariantListResponse> findAllProductVariant(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        int pageSize = pageable.getPageSize();
        int offset = (int) pageable.getOffset();

        List<ProductVariantListResponse> productDTOs = productVariantRepository.findAllProductVariant(pageSize, offset);
        long totalProducts = productVariantRepository.countTotalProductVariants();

        return new PageImpl<>(productDTOs, pageable, totalProducts);
    }

}
