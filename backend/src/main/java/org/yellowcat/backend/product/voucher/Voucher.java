package org.yellowcat.backend.product.voucher;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.yellowcat.backend.user.AppUser;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "voucher_id")
    private Integer voucherId;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private AppUser createdBy;

    @Column(unique = true, length = 50, name = "voucher_code")
    private String voucherCode;

    @Column(nullable = false, name = "voucher_name")
    private String voucherName;

    private String description;

    @Column(nullable = false, name = "discount_type")
    private String discountType;

    @Column(nullable = false, precision = 10, scale = 2, name = "discount_value")
    private BigDecimal discountValue;

    @Column(nullable = false, name = "start_date")
    private LocalDateTime startDate;

    @Column(nullable = false, name = "end_date")
    private LocalDateTime endDate;

    @Builder.Default
    @Column(nullable = false, name = "is_active")
    private Boolean isActive = true;

    @Column(nullable = false, precision = 12, scale = 2, name = "minimum_order_value")
    private BigDecimal minimumOrderValue;

    @Column(precision = 12, scale = 2, name = "maximum_discount_value")
    private BigDecimal maximumDiscountValue;

    @Column(name = "usage_limit_per_user")
    private Integer usageLimitPerUser;

    @Column(name = "usage_limit_total")
    private Integer usageLimitTotal;

    @Builder.Default
    @Column(name = "is_stackable")
    private Boolean isStackable = false;

    @Column(name = "total_used")
    private Integer totalUsed;

    @Column(name = "total_remaining")
    private Integer totalRemaining;

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
        this.totalUsed = 0;
        this.totalRemaining = this.usageLimitTotal != null ? this.usageLimitTotal : Integer.MAX_VALUE;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.totalUsed == null) {
            this.totalUsed = 0;
        }
        if (this.totalRemaining == null) {
            this.totalRemaining = this.usageLimitTotal != null ? this.usageLimitTotal - this.totalUsed : Integer.MAX_VALUE;
        } else {
            this.totalRemaining = Math.max(0, this.totalRemaining - this.totalUsed);
        }
    }
}
