
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
    private Integer productId;

    @NotNull
    private Integer rating;

    @Size(max = 1000)
    private String comment;

    // Không cần customerName vì sẽ lấy từ AppUser thông qua JWT token
}

