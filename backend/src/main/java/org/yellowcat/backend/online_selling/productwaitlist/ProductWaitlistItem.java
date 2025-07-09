package org.yellowcat.backend.online_selling.productwaitlist;


import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.product.productvariant.ProductVariant;

@Entity
@Table(name = "product_waitlist_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductWaitlistItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "waitlist_request_id", nullable = false)
    private ProductWaitlistRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id", nullable = false)
    private ProductVariant productVariant;

    @Column(name = "desired_quantity", nullable = false)
    private int desiredQuantity;
}
