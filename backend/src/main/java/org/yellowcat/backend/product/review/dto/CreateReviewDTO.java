
package org.yellowcat.backend.product.review.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CreateReviewDTO {
    @NotNull
    private Integer rating;

    @Size(max = 500, min = 1)
    private String comment;

    private String customerName;
}

