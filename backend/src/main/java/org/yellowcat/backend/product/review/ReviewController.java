// ReviewController.java
package org.yellowcat.backend.product.review;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.product.review.dto.CreateReviewDTO;
import org.yellowcat.backend.product.review.dto.ReviewDTO;
import org.yellowcat.backend.product.review.dto.ReviewStatsDTO;
import org.yellowcat.backend.user.AppUser;

import java.util.List;
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ReviewController {
    private final ReviewService reviewService;

    @GetMapping("/products/{id}/review-stats")
    public ResponseEntity<ReviewStatsDTO> getReviewStats(@PathVariable Integer id) {
        return ResponseEntity.ok(reviewService.getReviewStatsByProductId(id));
    }

    @GetMapping("/products/{id}/reviews")
    public ResponseEntity<List<ReviewDTO>> getReviewsByProduct(@PathVariable Integer id,
                                                               @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(reviewService.findByProduct(id, page));
    }

    @PostMapping("/products/{id}/reviews")
    public ResponseEntity<?> createReview(@PathVariable Integer id,
                                          @RequestBody @Valid CreateReviewDTO dto,
                                          Authentication authentication) {
        AppUser user = (AppUser) authentication.getPrincipal();
        reviewService.createReview(dto, user);
        return ResponseEntity.status(HttpStatus.CREATED).body("Đánh giá đã được thêm thành công");
    }

    @PutMapping("/products/{id}/reviews")
    public ResponseEntity<?> updateReview(@PathVariable Integer id,
                                          @RequestBody @Valid CreateReviewDTO dto,
                                          Authentication authentication) {
        AppUser user = (AppUser) authentication.getPrincipal();
        reviewService.updateReview(dto, user);
        return ResponseEntity.ok("Đánh giá đã được cập nhật thành công");
    }

    @DeleteMapping("/products/{productId}/reviews/{variantId}")
    public ResponseEntity<?> deleteReview(@PathVariable Integer productId,
                                          @PathVariable Integer variantId,
                                          Authentication authentication) {
        AppUser user = (AppUser) authentication.getPrincipal();
        reviewService.deleteReview(variantId, user);
        return ResponseEntity.ok("Đánh giá đã bị xóa");
    }
}
