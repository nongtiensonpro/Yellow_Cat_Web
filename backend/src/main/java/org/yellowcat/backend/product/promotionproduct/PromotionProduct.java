package org.yellowcat.backend.product.promotionproduct;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.promotion.Promotion;

@Entity
@Table(name = "promotion_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_product_id")
    private Integer promotionProductId;

    // Không cần appUser ở đây vì thông tin user đã có trong promotion

    @ManyToOne
    @JoinColumn(name = "promotion_id", nullable = false, referencedColumnName = "promotion_id", foreignKey = @ForeignKey(name = "fk_promotion_product_promotion"))
    private Promotion promotion;

    @ManyToOne
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant productVariant;
}
