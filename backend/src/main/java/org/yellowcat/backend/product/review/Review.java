package org.yellowcat.backend.product.review;

import jakarta.persistence.*; // Hoặc import javax.persistence.*
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.user.User; // Import lớp AppUser của bạn
import java.time.LocalDateTime;
@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "Reviews",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"variant_id", "app_user_id"}) // Ràng buộc UNIQUE từ SQL
})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Integer reviewId;

    @ManyToOne
    @JoinColumn(name = "variant_id", nullable = false) // Khóa ngoại trỏ đến ProductVariants
    private ProductVariant productVariant;

    @ManyToOne
    @JoinColumn(name = "app_user_id", nullable = false) // Khóa ngoại trỏ đến AppUsers
    private User appUser;

    @Column(name = "rating", nullable = false)
    private Short rating;

    @Column(name = "comment")
    private String comment;

    @Column(name = "review_date", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime reviewDate;


}