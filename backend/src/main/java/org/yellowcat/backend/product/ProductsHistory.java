package org.yellowcat.backend.product;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.user.AppUser;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "products_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductsHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Integer historyId;

    @Column(name = "history_group_id", nullable = false, updatable = false)
    private UUID historyGroupId;

    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Column(name = "product_name")
    private String productName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "brand_id")
    private Integer brandId;

    @Column(name = "material_id")
    private Integer materialId;

    @Column(name = "target_audience_id")
    private Integer targetAudienceId;

    @Column(name = "is_featured")
    private Boolean isFeatured;

    private Integer purchases;

    @Column(name = "is_active")
    private Boolean isActive;

    private String thumbnail;

    @Column(name = "created_at")
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
        this.historyGroupId = UUID.randomUUID();
        this.createdAt = LocalDateTime.now();
        this.changedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        this.changedAt = LocalDateTime.now();
    }
}