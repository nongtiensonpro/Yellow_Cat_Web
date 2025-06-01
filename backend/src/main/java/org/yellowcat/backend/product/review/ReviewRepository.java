package org.yellowcat.backend.product.review;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.yellowcat.backend.product.review.dto.ReviewDTO;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Integer> {
    @Query("SELECT r.reviewDate AS createdAt," +
            "r.comment AS content, " +
            "r.rating AS rating," +
            "au.fullName AS customerName," +
            "au.avatarUrl AS customerAvatar," +
            "pv.sku AS productVariation " +
            "FROM Review r " +
            "LEFT JOIN r.productVariant pv " +
            "LEFT JOIN r.appUser au " +
            "WHERE pv.product.id = :productId")
    List<ReviewDTO> findAllReviewByProductId(Integer productId, Pageable pageable);

    @Query("SELECT COUNT(r), COALESCE(AVG(r.rating), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END), 0) " +
            "FROM Review r " +
            "JOIN r.productVariant pv " +
            "WHERE pv.product.id = :productId")
    List<Object[]> getReviewStatsByProductId(Integer productId);
}