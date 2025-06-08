package org.yellowcat.backend.product.review;

import org.yellowcat.backend.product.review.dto.CreateReviewDTO;
import org.yellowcat.backend.product.review.dto.ReviewDTO;
import org.yellowcat.backend.product.review.dto.ReviewStatsDTO;
import org.yellowcat.backend.user.AppUser;

import java.util.List;

public interface ReviewService {
    Integer getPageSize();

    List<ReviewDTO> findByProduct(Integer productId, int page);

    void createReview(CreateReviewDTO dto, AppUser user);

    ReviewStatsDTO getReviewStatsByProductId(Integer productId);

    void updateReview(CreateReviewDTO dto, AppUser user);

    void deleteReview(Integer productVariantId, AppUser user);
}