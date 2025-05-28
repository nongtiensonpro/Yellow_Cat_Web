package org.yellowcat.backend.product.productvariant;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.yellowcat.backend.product.Product;

import java.math.BigDecimal;

@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "variant_id")
    private Integer id;

    private String sku;

    private String color;

    private String size;

    private BigDecimal price;

    @Column(name = "sale_price")
    private BigDecimal salePrice;

    @Column(name = "quantity_in_stock")
    private Integer stockLevel;

    private Integer sold;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "weight")
    private Double weight;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @PrePersist
    protected void onCreate() {
        if (salePrice == null) {
            salePrice = BigDecimal.ZERO;
        }
        if (sold == null) {
            sold = 0;
        }
    }
}