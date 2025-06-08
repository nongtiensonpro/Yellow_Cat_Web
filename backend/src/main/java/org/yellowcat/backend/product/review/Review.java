package org.yellowcat.backend.product.review;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.user.AppUser;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews",
        uniqueConstraints = @UniqueConstraint(columnNames = {"variant_id", "app_user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Integer reviewId;

    @ManyToOne
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "app_user_id")
    private AppUser appUser;

    @Column(nullable = false)
    private Short rating;

    @Column(length = 500)
    private String comment;

    @Column(name = "review_date")
    private LocalDateTime reviewDate;
}
