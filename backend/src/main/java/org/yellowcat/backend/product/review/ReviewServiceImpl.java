package org.yellowcat.backend.product.review;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.ProductRepository;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.product.review.Review;
import org.yellowcat.backend.product.review.ReviewRepository;
import org.yellowcat.backend.product.review.ReviewService;
import org.yellowcat.backend.product.review.dto.CreateReviewDTO;
import org.yellowcat.backend.product.review.dto.ReviewDTO;
import org.yellowcat.backend.product.review.dto.ReviewStatsDTO;
import org.yellowcat.backend.user.AppUser;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductVariantRepository productVariantRepository;

    @Override
    public Integer getPageSize() {
        return 5;
    }

    @Override
    public List<ReviewDTO> findByProduct(Integer productId, int page) {
        return reviewRepository.findAllReviewByProductId(productId, PageRequest.of(page, getPageSize()));
    }

    @Override
    public void createReview(CreateReviewDTO dto, AppUser user) {
        if (dto.getRating() == null) {
            throw new IllegalArgumentException("Rating không được để trống");
        }

        boolean isReviewed = reviewRepository.existsByProductVariantAndAppUser(
                dto.getProductVariantId(), user.getAppUserId()
        );

        if (isReviewed) {
            throw new IllegalArgumentException("Bạn đã đánh giá sản phẩm này rồi.");
        }

        ProductVariant variant = productVariantRepository.findById(dto.getProductVariantId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể sản phẩm"));

        Review review = new Review();
        review.setAppUser(user);
        review.setProductVariant(variant);
        review.setRating(dto.getRating().shortValue());
        review.setComment(dto.getComment());
        review.setReviewDate(LocalDateTime.now());

        reviewRepository.save(review);
    }


    @Override
    public void updateReview(CreateReviewDTO dto, AppUser user) {
        Review review = reviewRepository.findByVariantIdAndUserId(dto.getProductVariantId(), user.getAppUserId())
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa đánh giá sản phẩm này"));

        if (dto.getRating() != null) {
            review.setRating(dto.getRating().shortValue());
        }
        if (dto.getComment() != null) {
            review.setComment(dto.getComment());
        }

        review.setReviewDate(LocalDateTime.now());

        reviewRepository.save(review);
    }

    @Override
    public void deleteReview(Integer productVariantId, AppUser user) {
        Review review = reviewRepository.findByVariantIdAndUserId(productVariantId, user.getAppUserId())
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa đánh giá sản phẩm này"));

        reviewRepository.delete(review);
    }


    @Override
    public ReviewStatsDTO getReviewStatsByProductId(Integer productId) {
        List<Object[]> resultArray = reviewRepository.getReviewStatsByProductId(productId);

        if (!resultArray.isEmpty()) {
            Object[] result = resultArray.get(0);
            Long totalReviewsLong = (Long) result[0];
            int totalReviews = totalReviewsLong != null ? totalReviewsLong.intValue() : 0;
            double averageRating = (result[1] != null) ? ((Double) result[1]) : 0.0;
            List<Integer> starDistribution = Arrays.asList(0, 0, 0, 0, 0);

            if (totalReviews > 0) {
                starDistribution.set(4, ((Long) result[2]).intValue()); // 5 stars
                starDistribution.set(3, ((Long) result[3]).intValue()); // 4 stars
                starDistribution.set(2, ((Long) result[4]).intValue()); // 3 stars
                starDistribution.set(1, ((Long) result[5]).intValue()); // 2 stars
                starDistribution.set(0, ((Long) result[6]).intValue()); // 1 star
                starDistribution.replaceAll(integer -> (int) Math.round((double) integer / totalReviews * 100));
            }

            int totalPages = (int) Math.ceil((double) totalReviews / getPageSize());

            return new ReviewStatsDTO(averageRating, totalReviews, totalPages, starDistribution);
        }

        return new ReviewStatsDTO(0.0, 0, 0, Arrays.asList(0, 0, 0, 0, 0));
    }

    private double getAverageRatingByProductId(Integer productId) {
        List<Object[]> stats = reviewRepository.getReviewStatsByProductId(productId);
        if (stats.isEmpty() || stats.get(0)[1] == null) return 0.0;
        return ((Number) stats.get(0)[1]).doubleValue(); // Chỉ số 1 là AVG
    }

    private int getTotalReviewsByProductId(Integer productId) {
        List<Object[]> stats = reviewRepository.getReviewStatsByProductId(productId);
        if (stats.isEmpty() || stats.get(0)[0] == null) return 0;
        return ((Number) stats.get(0)[0]).intValue(); // Chỉ số 0 là COUNT
    }
//    @Override
//    public ReviewStatsDTO getReviewStatsByProductId(Integer productId) {
//        double avg = getAverageRatingByProductId(productId);
//        int total = getTotalReviewsByProductId(productId);
//        return new ReviewStatsDTO(avg, total);
//    }


}