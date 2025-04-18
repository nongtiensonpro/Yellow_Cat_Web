package org.yellowcat.backend.product.attribute.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Value;
import org.yellowcat.backend.product.attribute.Attributes;

import java.io.Serializable;

/**
 * DTO for {@link org.yellowcat.backend.product.attribute.Attributes}
 */
@Value
public class AttributesDto implements Serializable {
    Integer id;
    @NotNull
    @Size(max = 255)
    String attributeName;
    @NotNull
    @Size(max = 50)
    String dataType;

    public AttributesDto(Attributes attributes) {
        this.id = attributes.getId();
        this.attributeName = attributes.getAttributeName();
        this.dataType = attributes.getDataType();
    }
}