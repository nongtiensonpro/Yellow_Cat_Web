package org.yellowcat.backend.product.review;

import org.yellowcat.backend.product.review.dto.CreateReviewDTO;
import org.yellowcat.backend.product.review.dto.PaginatedReviewResponse;
import org.yellowcat.backend.product.review.dto.ReviewStatsDTO;

public interface ReviewService {
    PaginatedReviewResponse findByProduct(Integer productId, int page, int limit);
    ReviewStatsDTO getReviewStatsByProductId(Integer productId);
    Review createReview(CreateReviewDTO createReviewDTO, Integer appUserId);
    boolean canUserReviewProduct(Integer appUserId, Integer productId);
    boolean hasUserReviewedProduct(Integer appUserId, Integer productId);
    Review getUserReview(Integer appUserId, Integer productId);
}
