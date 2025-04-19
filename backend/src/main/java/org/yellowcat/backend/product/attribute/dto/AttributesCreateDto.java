package org.yellowcat.backend.product.attribute.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Value;

import java.io.Serializable;

/**
 * DTO for {@link org.yellowcat.backend.product.attribute.Attributes}
 */
@Value
public class AttributesCreateDto implements Serializable {
    @NotNull
    @Size(max = 255)
    String attributeName;
    @NotNull
    @Size(max = 50)
    String dataType;
}