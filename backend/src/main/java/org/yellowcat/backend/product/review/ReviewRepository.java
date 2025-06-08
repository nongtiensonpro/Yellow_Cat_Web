package org.yellowcat.backend.product.review;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.review.dto.ReviewDTO;
import org.yellowcat.backend.user.AppUser;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Integer> {
//    @Query("SELECT r.reviewDate AS createdAt," +
//            "r.comment AS content, " +
//            "r.rating AS rating," +
//            "au.fullName AS customerName," +
//            "au.avatarUrl AS customerAvatar," +
//            "pv.sku AS productVariation " +
//            "FROM Review r " +
//            "LEFT JOIN r.productVariant pv " +
//            "LEFT JOIN r.appUser au " +
//            "WHERE pv.product.productId = :productId")
//    List<ReviewDTO> findAllReviewByProductId(Integer productId, Pageable pageable);

    @Query("SELECT COUNT(r), COALESCE(AVG(r.rating), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END), 0) " +
            "FROM Review r " +
            "JOIN r.productVariant pv " + // Thêm JOIN để có alias cho ProductVariant
            "WHERE pv.product.productId = :productId") // Truy cập product từ ProductVariant (pv)
    List<Object[]> getReviewStatsByProductId(Integer productId);
    @Query("SELECT COUNT(r) > 0 FROM Review r WHERE r.productVariant.variantId = :productVariantId AND r.appUser.appUserId = :appUserId")
    boolean existsByProductVariantAndAppUser(@Param("productVariantId") Integer productVariantId,
                                             @Param("appUserId") Integer appUserId);



    @Query("SELECT r.reviewDate AS createdAt, r.comment AS comment, r.rating AS rating, " +
            "au.fullName AS customerName, au.avatarUrl AS customerAvatar, pv.sku AS productVariation " +
            "FROM Review r " +
            "JOIN r.productVariant pv " +
            "JOIN r.appUser au " +
            "WHERE pv.product.productId = :productId")
    List<ReviewDTO> findAllReviewByProductId(@Param("productId") Integer productId, Pageable pageable);
    @Query("SELECT r FROM Review r WHERE r.productVariant.variantId = :variantId AND r.appUser.appUserId = :userId")
    Optional<Review> findByVariantIdAndUserId(@Param("variantId") Integer variantId, @Param("userId") Integer userId);


}