package org.yellowcat.backend.product.promotionorder;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.yellowcat.backend.product.order.Order;

import java.time.LocalDateTime;

@Entity
@Table(name = "used_promotions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsedPromotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "used_promotion_id")
    private Integer usedPromotionId;

    @ManyToOne
    @JoinColumn(name = "promotion_program_id", nullable = false)
    private PromotionProgram promotionProgram;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "quantity_used", nullable = false)
    @Builder.Default
    private Integer quantityUsed = 0;

    @Column(name = "used_at", nullable = false)
    private LocalDateTime usedAt;

    @PrePersist
    private void prePersist() {
        if (usedAt == null) {
            usedAt = LocalDateTime.now();
        }
    }
}

