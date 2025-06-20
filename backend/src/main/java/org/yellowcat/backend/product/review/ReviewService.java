// ReviewService.java
package org.yellowcat.backend.product.review;

import org.yellowcat.backend.product.review.dto.CreateReviewDTO;
import org.yellowcat.backend.product.review.dto.PaginatedReviewResponse;
import org.yellowcat.backend.product.review.dto.ReviewStatsDTO;
import org.yellowcat.backend.user.AppUser;

public interface ReviewService {
    PaginatedReviewResponse findByProduct(Integer productId, int page, int limit);
    void createReview(CreateReviewDTO dto, AppUser user, Integer productId, Integer variantId);
    ReviewStatsDTO getReviewStatsByProductId(Integer productId);
}
