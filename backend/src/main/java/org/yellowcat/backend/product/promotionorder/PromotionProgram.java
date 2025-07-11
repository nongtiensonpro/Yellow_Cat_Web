package org.yellowcat.backend.product.promotionorder;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.yellowcat.backend.user.AppUser;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "promotion_programs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_program_id")
    private Integer promotionProgramId;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private AppUser createdBy;

    @ManyToOne
    @JoinColumn(name = "updated_by", nullable = false)
    private AppUser updatedBy;

    @Column(name = "promotion_code", unique = true, length = 50)
    private String promotionCode;

    @Column(name = "promotion_name", nullable = false)
    private String promotionName;

    private String description;

    @Column(name = "discount_type", nullable = false)
    private String discountType;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "minimum_order_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal minimumOrderValue;

    @Column(name = "usage_limit_per_user")
    private Integer usageLimitPerUser;

    @Column(name = "usage_limit_total")
    private Integer usageLimitTotal;

//    @Column(name = "total_used")
//    private Integer totalUsed;
//
//    @Column(name = "total_remaining")
//    private Integer totalRemaining;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isActive = true;
        this.usageLimitPerUser = this.usageLimitPerUser != null ? this.usageLimitPerUser : 1;
//        this.totalUsed = 0;
//        this.totalRemaining = this.usageLimitTotal != null ? this.usageLimitTotal : Integer.MAX_VALUE;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
//        if (this.totalUsed == null) {
//            this.totalUsed = 0;
//        }
//        if (this.totalRemaining == null) {
//            this.totalRemaining = this.usageLimitTotal != null ? this.usageLimitTotal - this.totalUsed : Integer.MAX_VALUE;
//        } else {
//            this.totalRemaining = Math.max(0, this.totalRemaining - this.totalUsed);
//        }
    }
}

