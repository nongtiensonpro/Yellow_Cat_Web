//// Review.java
//package org.yellowcat.backend.product.review;
//
//import jakarta.persistence.*;
//import jakarta.validation.constraints.Size;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import lombok.Setter;
//import org.yellowcat.backend.user.AppUser;
//import org.yellowcat.backend.product.productvariant.ProductVariant;
//
//import java.time.Instant;
//
//@Entity
//@Getter
//@Setter
//@NoArgsConstructor
//public class Review {
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    private int rating;
//
//    //    @Column(length = 100)
//    @Size(max = 100)
//    private String comment;
//
//    private Integer productId;
//    private Integer variantId;
//
//    private Instant createdAt;
//
//    private String customerName;
//
//    private String imageUrl;
//
//    private boolean isPurchased;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "user_id")
//    private AppUser appUser;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "variant_id")
//    private ProductVariant productVariant;
//}


package org.yellowcat.backend.product.review;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.product.productvariant.ProductVariant;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int rating;

    @Size(max = 100)
    private String comment;

    private Integer productId;

    private Instant createdAt;

    private String customerName;

    private String imageUrl;

    private boolean isPurchased;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser appUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant productVariant;
}

