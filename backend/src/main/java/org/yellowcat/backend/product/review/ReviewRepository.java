package org.yellowcat.backend.product.review;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.yellowcat.backend.product.review.dto.ReviewDTO;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    @Query("SELECT r.id AS id, r.rating AS rating, r.comment AS comment, r.reviewDate AS createdAt, " +
            "u.fullName AS customerName, u.avatarUrl AS customerAvatar, null AS imageUrl, true AS isPurchased " +
            "FROM Review r LEFT JOIN r.appUser u WHERE r.productId = :productId ORDER BY r.reviewDate DESC")
    List<ReviewDTO> findAllReviewByProductId(Integer productId, Pageable pageable);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.productId = :productId")
    long countReviewsByProductId(Integer productId);

    @Query("SELECT COALESCE(AVG(r.rating), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END), 0) " +
            "FROM Review r WHERE r.productId = :productId")
    List<Object[]> getReviewStatsCountsByProductId(Integer productId);

    @Query("SELECT COUNT(r) > 0 FROM Review r WHERE r.productId = :productId AND r.appUserId = :appUserId")
    boolean existsByProductIdAndAppUserId(@Param("productId") Integer productId, @Param("appUserId") Integer appUserId);

    @Query("SELECT r FROM Review r WHERE r.productId = :productId AND r.appUserId = :appUserId")
    Optional<Review> findByProductIdAndAppUserId(@Param("productId") Integer productId, @Param("appUserId") Integer appUserId);

    @Query("SELECT r FROM Review r JOIN FETCH r.appUser WHERE r.productId = :productId AND r.appUserId = :appUserId")
    Optional<Review> findByProductIdAndAppUserIdWithUser(@Param("productId") Integer productId, @Param("appUserId") Integer appUserId);

    @Query("SELECT r FROM Review r WHERE r.orderId = :orderId")
    List<Review> findAllByOrderId(@Param("orderId") Integer orderId);

    @Query("SELECT r.productId, r FROM Review r WHERE r.appUserId = :appUserId AND r.productId IN :productIds")
    List<Object[]> findReviewsByUserIdAndProductIds(@Param("appUserId") Integer appUserId, @Param("productIds") List<Integer> productIds);
}

