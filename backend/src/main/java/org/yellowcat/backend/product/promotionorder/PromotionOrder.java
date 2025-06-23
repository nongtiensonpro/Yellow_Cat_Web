package org.yellowcat.backend.product.promotionorder;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.promotion.Promotion;

import java.math.BigDecimal;

@Entity
@Table(name = "promotion_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_product_id")
    private Integer promotionProductId;

    @ManyToOne
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "minimum_order_value", precision = 12, scale = 2, nullable = false)
    private BigDecimal minimumOrderValue;

    @Column(name = "usage_limit_per_user")
    private Integer usageLimitPerUser = 1;

    @Column(name = "usage_limit_total")
    private Integer usageLimitTotal;
}
