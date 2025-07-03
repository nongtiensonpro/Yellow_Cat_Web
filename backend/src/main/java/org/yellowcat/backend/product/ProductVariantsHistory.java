package org.yellowcat.backend.product;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.user.AppUser;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_variants_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantsHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Integer historyId;

    @Column(name = "history_group_id", nullable = false, updatable = false)
    private UUID historyGroupId;

    @Column(name = "variant_id", nullable = false)
    private Integer variantId;

    @Column(name = "product_id")
    private Integer productId;

    private String sku;

    @Column(name = "color_id")
    private Integer colorId;

    @Column(name = "size_id")
    private Integer sizeId;

    private BigDecimal price;

    @Column(name = "sale_price")
    private BigDecimal salePrice;

    @Column(name = "quantity_in_stock")
    private Integer quantityInStock;

    private Integer sold;

    @Column(name = "image_url")
    private String imageUrl;

    private Float weight;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(length = 1)
    private Character operation;

    @Column(name = "changed_at")
    private LocalDateTime changedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private AppUser changedBy;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.changedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        this.changedAt = LocalDateTime.now();
    }
}
