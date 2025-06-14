//package org.yellowcat.backend.product.promotion;
//
//import jakarta.persistence.*;
//import lombok.AllArgsConstructor;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import lombok.Setter;
//
//import java.time.LocalDateTime;
//
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@Entity
//@Table(name = "Promotions")
//public class Promotion {
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    @Column(name = "promotion_id")
//    private Integer id;
//
//    @Column(name = "promotion_name")
//    private String name;
//
//    @Column(name = "discount_percent")
//    private Double discountPercent;
//
//    @Column(name = "end_date")
//    private LocalDateTime endDate;
//
//    @Column(name = "start_date")
//    private LocalDateTime startDate;
//
//    @Column(name = "is_active")
//    private Boolean isActive;
//}

package org.yellowcat.backend.product.promotion;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "promotions")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_id")
    private Integer id;

    @Column(name = "promo_code", nullable = false, unique = true)
    private String promoCode;

    @Column(name = "promotion_name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "discount_type")
    private String discountType;

    @Column(name = "discount_value")
    private Double discountValue;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "minimum_order_value")
    private Double minimumOrderValue;

    @Column(name = "usage_limit_per_user")
    private Integer usageLimitPerUser;

    @Column(name = "usage_limit_total")
    private Integer usageLimitTotal;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "applicable_to")
    private String applicableTo;
}

