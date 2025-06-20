//
//// ReviewServiceImpl.java
//package org.yellowcat.backend.product.review;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.stereotype.Service;
//import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
//import org.yellowcat.backend.product.review.dto.*;
//import org.yellowcat.backend.user.AppUser;
//
//import jakarta.persistence.EntityNotFoundException;
//import java.time.Instant;
//import java.util.ArrayList;
//import java.util.Arrays;
//import java.util.List;
//
//@Service
//@RequiredArgsConstructor
//public class ReviewServiceImpl implements ReviewService {
//    private final ReviewRepository reviewRepository;
//    private final ProductVariantRepository productVariantRepository;
//
//    @Override
//    public PaginatedReviewResponse findByProduct(Integer productId, int page, int limit) {
//        var pageRequest = PageRequest.of(page, limit);
//        var reviews = reviewRepository.findAllReviewByProductId(productId, pageRequest);
//        long totalReviews = reviewRepository.countReviewsByProductId(productId);
//        int totalPages = (int) Math.ceil((double) totalReviews / limit);
//        return new PaginatedReviewResponse(reviews, totalPages, page, totalReviews, limit);
//    }
//
//    @Override
//    public void createReview(CreateReviewDTO dto, AppUser user, Integer productId, Integer variantId) {
//        var variant = productVariantRepository.findById(variantId)
//                .orElseThrow(() -> new EntityNotFoundException("Variant not found"));
//
//        var review = new Review();
//        review.setProductId(productId);
//        review.setVariantId(variantId);
//        review.setProductVariant(variant);
//        review.setAppUser(user);
//        review.setCustomerName(user != null ? user.getFullName() : dto.getCustomerName());
//        review.setRating(dto.getRating());
//        review.setComment(dto.getComment());
//        review.setCreatedAt(Instant.now());
//
//        reviewRepository.save(review);
//    }
//
//    @Override
//    public ReviewStatsDTO getReviewStatsByProductId(Integer productId) {
//        var resultArray = reviewRepository.getReviewStatsCountsByProductId(productId);
//        if (resultArray.isEmpty()) {
//            return new ReviewStatsDTO(0.0, 0, defaultStarDistribution());
//        }
//
//        var result = resultArray.get(0);
//        double averageRating = (Double) result[0];
//        long totalReviewsLong = reviewRepository.countReviewsByProductId(productId);
//        int totalReviews = (int) totalReviewsLong;
//
//        List<ReviewStatsDTO.StarDistributionItem> starDistribution = new ArrayList<>();
//        for (int i = 1; i <= 5; i++) {
//            starDistribution.add(new ReviewStatsDTO.StarDistributionItem(6 - i, ((Long) result[i]).intValue()));
//        }
//        return new ReviewStatsDTO(averageRating, totalReviews, starDistribution);
//    }
//
//    private List<ReviewStatsDTO.StarDistributionItem> defaultStarDistribution() {
//        return Arrays.asList(
//                new ReviewStatsDTO.StarDistributionItem(5, 0),
//                new ReviewStatsDTO.StarDistributionItem(4, 0),
//                new ReviewStatsDTO.StarDistributionItem(3, 0),
//                new ReviewStatsDTO.StarDistributionItem(2, 0),
//                new ReviewStatsDTO.StarDistributionItem(1, 0)
//        );
//    }
//}

package org.yellowcat.backend.product.review;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.product.review.dto.*;
import org.yellowcat.backend.user.AppUser;

import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductVariantRepository productVariantRepository;

    @Override
    public PaginatedReviewResponse findByProduct(Integer productId, int page, int limit) {
        var pageRequest = PageRequest.of(page, limit);
        var reviews = reviewRepository.findAllReviewByProductId(productId, pageRequest);
        long totalReviews = reviewRepository.countReviewsByProductId(productId);
        int totalPages = (int) Math.ceil((double) totalReviews / limit);
        return new PaginatedReviewResponse(reviews, totalPages, page, totalReviews, limit);
    }

    @Override
    public void createReview(CreateReviewDTO dto, AppUser user, Integer productId, Integer variantId) {
        var variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new EntityNotFoundException("Variant not found"));

        var review = new Review();
        review.setProductId(productId);
        review.setProductVariant(variant); // ✅ Duy nhất dùng productVariant
        review.setAppUser(user);
        review.setCustomerName(user != null ? user.getFullName() : dto.getCustomerName());
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setCreatedAt(Instant.now());

        reviewRepository.save(review);
    }

    @Override
    public ReviewStatsDTO getReviewStatsByProductId(Integer productId) {
        var resultArray = reviewRepository.getReviewStatsCountsByProductId(productId);
        if (resultArray.isEmpty()) {
            return new ReviewStatsDTO(0.0, 0, defaultStarDistribution());
        }

        var result = resultArray.get(0);
        double averageRating = (Double) result[0];
        long totalReviewsLong = reviewRepository.countReviewsByProductId(productId);
        int totalReviews = (int) totalReviewsLong;

        List<ReviewStatsDTO.StarDistributionItem> starDistribution = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            starDistribution.add(new ReviewStatsDTO.StarDistributionItem(6 - i, ((Long) result[i]).intValue()));
        }
        return new ReviewStatsDTO(averageRating, totalReviews, starDistribution);
    }

    private List<ReviewStatsDTO.StarDistributionItem> defaultStarDistribution() {
        return Arrays.asList(
                new ReviewStatsDTO.StarDistributionItem(5, 0),
                new ReviewStatsDTO.StarDistributionItem(4, 0),
                new ReviewStatsDTO.StarDistributionItem(3, 0),
                new ReviewStatsDTO.StarDistributionItem(2, 0),
                new ReviewStatsDTO.StarDistributionItem(1, 0)
        );
    }
}
