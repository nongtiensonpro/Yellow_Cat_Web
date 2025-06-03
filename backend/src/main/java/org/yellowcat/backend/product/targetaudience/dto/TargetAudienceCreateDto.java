package org.yellowcat.backend.product.targetaudience.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.Value;
import org.yellowcat.backend.product.targetaudience.TargetAudience;

import java.io.Serializable;

/**
 * DTO for {@link TargetAudience}
 */
@Value
@Getter
@Setter
public class TargetAudienceCreateDto implements Serializable {
    @NotNull
    String name;
    String description;
}