package org.yellowcat.backend.product.attribute.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.yellowcat.backend.product.attribute.Attributes;

import java.io.Serializable;

/**
 * DTO for {@link org.yellowcat.backend.product.attribute.Attributes}
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttributesDto implements Serializable {
    private Integer id;
    @NotNull
    @Size(max = 255)
    private String attributeName;
    @NotNull
    @Size(max = 50)
    private String dataType;

    public AttributesDto(Attributes attributes) {
        this.id = attributes.getId();
        this.attributeName = attributes.getAttributeName();
        this.dataType = attributes.getDataType();
    }
}