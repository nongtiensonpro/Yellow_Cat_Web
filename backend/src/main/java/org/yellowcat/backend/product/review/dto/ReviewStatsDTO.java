
// ReviewStatsDTO.java
package org.yellowcat.backend.product.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ReviewStatsDTO {
    private double averageRating;
    private int totalReviews;
    private List<StarDistributionItem> starDistribution;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StarDistributionItem {
        private int star;
        private int count;
    }
}
