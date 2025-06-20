
package org.yellowcat.backend.product.review;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.product.review.dto.*;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserService;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;
    private final AppUserService appUserService;

    @GetMapping
    public ResponseEntity<PaginatedReviewResponse> getProductReviews(
            @RequestParam("productId") Integer productId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "limit", defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(reviewService.findByProduct(productId, page, limit));
    }

    @GetMapping("/stats")
    public ResponseEntity<ReviewStatsDTO> getReviewStats(@RequestParam("productId") Integer productId) {
        var stats = reviewService.getReviewStatsByProductId(productId);
        return ResponseEntity.ok(stats);
    }

    @PostMapping
    public ResponseEntity<?> createReview(
            @RequestParam("productId") Integer productId,
            @RequestParam("variantId") Integer variantId,
            @RequestBody CreateReviewDTO dto,
            Authentication authentication
    ) {
        AppUser user = null;
        if (authentication != null && authentication.isAuthenticated()) {
            user = appUserService.findByEmail(authentication.getName()).orElse(null);
        }
        reviewService.createReview(dto, user, productId, variantId);
        return ResponseEntity.status(HttpStatus.CREATED).body("Review created successfully");
    }
}



