package org.yellowcat.backend.product.review.dto;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateReviewDTO {

    @NotNull(message = "productVariantId không được để trống")
    private Integer productVariantId;

    @NotNull(message = "rating không được để trống")
    @Min(1)
    @Max(5)
    private Integer rating;

    @Size(max = 500, message = "comment không được dài quá 500 ký tự")
    private String comment;
}
