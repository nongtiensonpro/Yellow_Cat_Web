
// ReviewRepository.java
package org.yellowcat.backend.product.review;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.yellowcat.backend.product.review.dto.ReviewDTO;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Integer> {
    @Query("SELECT r.id AS id, r.rating AS rating, r.comment AS comment, r.createdAt AS createdAt, " +
            "COALESCE(r.customerName, u.fullName) AS customerName, u.avatarUrl AS customerAvatar, r.imageUrl AS imageUrl, r.isPurchased AS isPurchased " +
            "FROM Review r LEFT JOIN r.appUser u WHERE r.productId = :productId ORDER BY r.createdAt DESC")
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
}

