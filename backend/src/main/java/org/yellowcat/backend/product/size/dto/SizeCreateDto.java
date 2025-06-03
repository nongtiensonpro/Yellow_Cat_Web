package org.yellowcat.backend.product.size.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.Value;
import org.yellowcat.backend.product.size.Size;

import java.io.Serializable;

/**
 * DTO for {@link Size}
 */
@Value
@Getter
@Setter
public class SizeCreateDto implements Serializable {
    @NotNull
    String name;
    String description;
}