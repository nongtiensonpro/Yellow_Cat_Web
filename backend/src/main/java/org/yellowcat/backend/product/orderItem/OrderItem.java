package org.yellowcat.backend.product.orderItem;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.productvariant.ProductVariant;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Integer orderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "price_at_purchase", precision = 12, scale = 2, nullable = false)
    private BigDecimal priceAtPurchase;

    @Column(name = "total_price", precision = 14, scale = 2, nullable = false)
    private BigDecimal totalPrice;

    @OneToMany(mappedBy = "orderItem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private java.util.List<org.yellowcat.backend.product.promotionapplied.AppliedPromotion> appliedPromotions = new java.util.ArrayList<>();
}