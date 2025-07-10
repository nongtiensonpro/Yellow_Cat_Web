package org.yellowcat.backend.product.promotionproduct.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckDuplicateVariantsRequest {
    /**
     * The IDs of the variants you want to check for overlap.
     */
    private List<Integer> variantIds;

    /**
     * The inclusive start date of the promotion window.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    /**
     * The inclusive end date of the promotion window.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate endDate;
}
