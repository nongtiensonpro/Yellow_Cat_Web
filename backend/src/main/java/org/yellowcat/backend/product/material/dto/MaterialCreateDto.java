package org.yellowcat.backend.product.material.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.Value;
import org.yellowcat.backend.product.material.Material;

import java.io.Serializable;

/**
 * DTO for {@link Material}
 */
@Value
@Getter
@Setter
public class MaterialCreateDto implements Serializable {
    @NotNull
    String name;
    String description;
}