package org.yellowcat.backend.product.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Value;
import org.yellowcat.backend.product.brand.dto.BrandSummaryDto;
import org.yellowcat.backend.product.category.dto.CategorySummaryDto;

import java.io.Serializable;

/**
 * DTO for {@link org.yellowcat.backend.product.Product}
 */

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProductDto(Integer id, @NotNull @Size(max = 255) String productName, CategorySummaryDto category, BrandSummaryDto brand)
        implements Serializable {
}