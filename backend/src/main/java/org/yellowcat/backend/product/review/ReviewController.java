package org.yellowcat.backend.product.review;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.product.review.ReviewService;
import org.yellowcat.backend.product.review.dto.ReviewDTO;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReviewController {
     ReviewService reviewService;

    @GetMapping("/products/{id}/reviews")
    public ResponseEntity<List<ReviewDTO>> getProductReviews(@PathVariable Integer id, @RequestParam(value = "page", defaultValue = "1") int page) {

        return ResponseEntity.ok(reviewService.findByProduct(id, page - 1));
    }


}