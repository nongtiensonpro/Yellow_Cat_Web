//package org.yellowcat.backend.product.promotion;
//
//import jakarta.persistence.*;
//import lombok.AllArgsConstructor;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import lombok.Setter;
//import org.yellowcat.backend.user.AppUser;
//
//import java.math.BigDecimal;
//import java.time.LocalDateTime;
//
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@Entity
//@Table(name = "promotions")
//public class Promotion {
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    @Column(name = "promotion_id")
//    private Integer id;
//
//    @OneToOne
//    @JoinColumn(name = "app_user_id", nullable = false)
//    private AppUser appUser;
//
//    @Column(name = "promotion_code", length = 50, unique = true)
//    private String promotionCode;
//
//    @Column(name = "promotion_name", nullable = false)
//    private String promotionName;
//
//    @Column(name = "description", columnDefinition = "TEXT")
//    private String description;
//
//    @Column(name = "discount_type", length = 20, nullable = false)
//    private String discountType;
//
//    @Column(name = "discount_value", precision = 10, scale = 2, nullable = false)
//    private BigDecimal discountValue;
//
//    @Column(name = "start_date", nullable = false)
//    private LocalDateTime startDate;
//
//    @Column(name = "end_date", nullable = false)
//    private LocalDateTime endDate;
//
//    @Column(name = "is_active")
//    private Boolean isActive = true;
//
//    @Column(name = "created_at", updatable = false)
//    private LocalDateTime createdAt = LocalDateTime.now();
//
//    @Column(name = "updated_at")
//    private LocalDateTime updatedAt = LocalDateTime.now();
//
//    @PrePersist
//    public void prePersist() {
//        createdAt = LocalDateTime.now();
//        updatedAt = LocalDateTime.now();
//    }
//
//    @PreUpdate
//    public void preUpdate() {
//        updatedAt = LocalDateTime.now();
//    }
//}


package org.yellowcat.backend.product.promotion;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.product.promotionproduct.PromotionProduct;
import org.yellowcat.backend.user.AppUser;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "promotions")
@Getter
@Setter
@NoArgsConstructor // Giữ lại constructor rỗng
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_id")
    private Integer id;

    // Đã sửa thành @ManyToOne và đảm bảo không null
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_user_id", nullable = false)
    private AppUser appUser;

    @Column(name = "promotion_code", length = 50, unique = true)
    private String promotionCode;

    @Column(name = "promotion_name", nullable = false)
    private String promotionName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "discount_type", length = 20, nullable = false)
    private String discountType;

    @Column(name = "discount_value", precision = 10, scale = 2, nullable = false)
    private BigDecimal discountValue;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // THÊM MỐI QUAN HỆ @OneToMany với PromotionProduct
    @OneToMany(mappedBy = "promotion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PromotionProduct> promotionProducts = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        // Chỉ thiết lập giá trị tại đây, không cần khởi tạo mặc định trên khai báo
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}