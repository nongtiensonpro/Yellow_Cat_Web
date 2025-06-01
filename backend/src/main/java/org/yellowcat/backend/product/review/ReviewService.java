package org.yellowcat.backend.product.review;

import org.yellowcat.backend.product.review.dto.CreateReviewDTO;
import org.yellowcat.backend.product.review.dto.ReviewDTO;
import org.yellowcat.backend.product.review.dto.ReviewStatsDTO;
import org.yellowcat.backend.user.User;

import java.util.List;

public interface ReviewService {
    Integer getPageSize();

    List<ReviewDTO> findByProduct(Integer productId, int page);

    void createReview(CreateReviewDTO dto, User user);

    ReviewStatsDTO getReviewStatsByProductId(Integer productId);
}