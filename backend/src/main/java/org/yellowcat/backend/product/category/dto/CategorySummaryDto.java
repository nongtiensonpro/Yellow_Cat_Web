package org.yellowcat.backend.product.category.dto;

import java.io.Serializable;

/**
 * DTO for {@link org.yellowcat.backend.product.category.Category} summary
 */
public record CategorySummaryDto(Integer id, String name) implements Serializable {
}