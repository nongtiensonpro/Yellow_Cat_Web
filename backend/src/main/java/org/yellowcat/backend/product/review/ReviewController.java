
package org.yellowcat.backend.product.review;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.review.dto.*;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;
    private final AppUserRepository appUserRepository;
    private final ReviewServiceImpl reviewServiceImpl;

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
            @Valid @RequestBody CreateReviewDTO createReviewDTO,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            // Lấy keycloakId từ JWT token
            String keycloakIdStr = jwt.getSubject();
            UUID keycloakId = UUID.fromString(keycloakIdStr);

            // Tìm AppUser từ keycloakId
            AppUser appUser = appUserRepository.findByKeycloakId(keycloakId)
                    .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại trong hệ thống"));

            // Tạo đánh giá
            Review review = reviewService.createReview(createReviewDTO, appUser.getAppUserId());

            return ResponseEntityBuilder.success("Đánh giá sản phẩm thành công", review);
        } catch (RuntimeException e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "Lỗi tạo đánh giá", e.getMessage());
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống", e.getMessage());
        }
    }

    @GetMapping("/can-review")
    public ResponseEntity<?> canUserReviewProduct(
            @RequestParam("productId") Integer productId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            // Lấy keycloakId từ JWT token
            String keycloakIdStr = jwt.getSubject();
            UUID keycloakId = UUID.fromString(keycloakIdStr);

            // Tìm AppUser từ keycloakId
            AppUser appUser = appUserRepository.findByKeycloakId(keycloakId)
                    .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại trong hệ thống"));

            // Kiểm tra quyền đánh giá
            boolean canReview = reviewService.canUserReviewProduct(appUser.getAppUserId(), productId);

            return ResponseEntityBuilder.success("Kiểm tra quyền đánh giá thành công", canReview);
        } catch (RuntimeException e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "Lỗi kiểm tra quyền", e.getMessage());
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống", e.getMessage());
        }
    }

    @GetMapping("/has-reviewed")
    public ResponseEntity<?> hasUserReviewedProduct(
            @RequestParam("productId") Integer productId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            // Lấy keycloakId từ JWT token
            String keycloakIdStr = jwt.getSubject();
            UUID keycloakId = UUID.fromString(keycloakIdStr);

            // Tìm AppUser từ keycloakId
            AppUser appUser = appUserRepository.findByKeycloakId(keycloakId)
                    .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại trong hệ thống"));

            // Kiểm tra đã đánh giá chưa
            boolean hasReviewed = reviewService.hasUserReviewedProduct(appUser.getAppUserId(), productId);

            return ResponseEntityBuilder.success("Kiểm tra trạng thái đánh giá thành công", hasReviewed);
        } catch (RuntimeException e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "Lỗi kiểm tra trạng thái", e.getMessage());
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống", e.getMessage());
        }
    }

    @GetMapping("/user-review")
    public ResponseEntity<?> getUserReview(
            @RequestParam("productId") Integer productId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            // Lấy keycloakId từ JWT token
            String keycloakIdStr = jwt.getSubject();
            UUID keycloakId = UUID.fromString(keycloakIdStr);

            // Tìm AppUser từ keycloakId
            AppUser appUser = appUserRepository.findByKeycloakId(keycloakId)
                    .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại trong hệ thống"));

            // Lấy đánh giá của người dùng
            Review userReview = reviewService.getUserReview(appUser.getAppUserId(), productId);

            // Tạo DTO để tránh lỗi Lazy Loading
            Map<String, Object> reviewData = new HashMap<>();
            reviewData.put("id", userReview.getId());
            reviewData.put("productId", userReview.getProductId());
            reviewData.put("rating", userReview.getRating());
            reviewData.put("comment", userReview.getComment());
            reviewData.put("reviewDate", userReview.getReviewDate());

            return ResponseEntityBuilder.success("Lấy đánh giá thành công", reviewData);
        } catch (RuntimeException e) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "Lỗi lấy đánh giá", e.getMessage());
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống", e.getMessage());
        }
    }

    // API tạo review mới cho đơn hàng online
    @PostMapping("/creat-online")
    public ResponseEntity<?> createReviewOnline(
            @RequestBody CreateReviewDTO createReviewDTO,
            @RequestParam Integer appUserId,
            @RequestParam Integer orderId) {
        try {
            Review review = reviewServiceImpl.createReviewOnline(createReviewDTO, appUserId, orderId);
            return ResponseEntityBuilder.success("Đánh giá sản phẩm online thành công", review);
        } catch (DataIntegrityViolationException e) {
            // Lỗi vi phạm ràng buộc (ví dụ unique: 1 người dùng chỉ đánh giá 1 lần/ sản phẩm)
            return ResponseEntityBuilder.error(HttpStatus.CONFLICT, "Đánh giá đã tồn tại", "Bạn đã đánh giá sản phẩm này rồi");
        } catch (RuntimeException e) {
            // Lỗi nghiệp vụ (chưa mua hàng, order không hợp lệ, v.v.)
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "Không thể tạo đánh giá", e.getMessage());
        } catch (Exception e) {
            // Lỗi hệ thống chung
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống", e.getMessage());
        }
    }

    // API lấy danh sách review theo orderId
    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getReviewsByOrder(@PathVariable Integer orderId) {
        try {
            List<Map<String, Object>> reviews = reviewServiceImpl.getListReviewByOrder(orderId);
            return ResponseEntityBuilder.success("Lấy danh sách đánh giá theo đơn hàng thành công", reviews);
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi lấy danh sách review", e.getMessage());
        }
    }
}



