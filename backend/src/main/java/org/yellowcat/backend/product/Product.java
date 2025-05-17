package org.yellowcat.backend.product;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.yellowcat.backend.product.brand.Brand;
import org.yellowcat.backend.product.category.Category;
import org.yellowcat.backend.product.productattribute.ProductAttribute;
import org.yellowcat.backend.product.productvariant.ProductVariant;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @ColumnDefault("nextval('products_product_id_seq')")
    @Column(name = "product_id", nullable = false)
    private Integer id;

    @Size(max = 255)
    @NotNull
    @Column(name = "product_name", nullable = false)
    private String productName;

    @ManyToOne
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @ColumnDefault("0")
    @Column(name = "purchases")
    private Integer purchases;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ColumnDefault("true")
    @Column(name = "is_active")
    private Boolean isActive;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ProductVariant> variants;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ProductAttribute> productAttributes;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}