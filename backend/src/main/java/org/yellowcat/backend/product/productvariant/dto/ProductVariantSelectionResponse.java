package org.yellowcat.backend.product.productvariant.dto;

import java.math.BigDecimal;

public record ProductVariantSelectionResponse(
        Integer variantId,
        String sku,
        BigDecimal price,
        BigDecimal salePrice,
        String productName,
        String brandName,
        String colorName,
        String sizeName,
        String materialName
) {}
