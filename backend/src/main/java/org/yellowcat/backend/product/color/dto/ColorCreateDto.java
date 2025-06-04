package org.yellowcat.backend.product.color.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.Value;
import org.yellowcat.backend.product.color.Color;

import java.io.Serializable;

/**
 * DTO for {@link Color}
 */
@Value
@Getter
@Setter
public class ColorCreateDto implements Serializable {
    @NotNull
    String name;
    String description;
}