package org.yellowcat.backend.product.category.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.Value;

import java.io.Serializable;

/**
 * DTO for {@link org.yellowcat.backend.product.category.Category}
 */
@Value
@Getter
@Setter
public class CategoryCreateDto implements Serializable {
    @NotNull
    String name;
}