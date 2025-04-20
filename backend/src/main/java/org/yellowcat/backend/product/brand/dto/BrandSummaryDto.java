package org.yellowcat.backend.product.brand.dto;

import java.io.Serializable;

/**
 * DTO for {@link org.yellowcat.backend.product.brand.Brand} summary
 */
public record BrandSummaryDto(Integer id, String brandName) implements Serializable {
}