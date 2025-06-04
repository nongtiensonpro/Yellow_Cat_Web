package org.yellowcat.backend.product.orderItem;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.productvariant.ProductVariant;

import java.math.BigDecimal;

@Entity
@Table(name = "OrderItems") // Tên bảng vẫn là "OrderItems"
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem { // Tên class là OrderItem (số ít)

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Integer orderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "price_at_purchase", precision = 12, scale = 2, nullable = false)
    private BigDecimal priceAtPurchase;

    @Column(name = "total_price", precision = 14, scale = 2, nullable = false)
    private BigDecimal totalPrice;
}