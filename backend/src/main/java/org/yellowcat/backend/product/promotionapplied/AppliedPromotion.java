package org.yellowcat.backend.product.promotionapplied;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.product.orderItem.OrderItem;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "applied_promotions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppliedPromotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "applied_promotion_id")
    private Integer appliedPromotionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column(name = "promo_type", nullable = false, length = 20)
    private String promoType; // PRODUCT / ORDER / VOUCHER

    @Column(name = "promotion_code", length = 50, nullable = false)
    private String promotionCode;

    @Column(name = "promotion_name")
    private String promotionName;

    @Column(name = "discount_type", length = 20)
    private String discountType;

    @Column(name = "discount_value", precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "discount_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal discountAmount;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt = LocalDateTime.now();
} 