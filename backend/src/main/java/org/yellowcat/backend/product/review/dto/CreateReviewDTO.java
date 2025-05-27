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

    @Size(min = 1, max = 5)
    Integer rating;
    @Size(max = 500, min = 1)
    String comment;
}