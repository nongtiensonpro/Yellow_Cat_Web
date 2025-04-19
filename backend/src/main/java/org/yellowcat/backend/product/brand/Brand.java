package org.yellowcat.backend.product.brand;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;
import org.yellowcat.backend.product.Product;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "brands")
public class Brand {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "brands_id_gen")
    @Column(name = "brand_id", nullable = false)
    private Integer id;

    @Size(max = 255)
    @NotNull
    @Column(name = "brand_name", nullable = false)
    private String brandName;

    @Size(max = 255)
    @NotNull
    @Column(name = "logo_public_id", nullable = false)
    private String logoPublicId;

    @NotNull
    @Column(name = "brand_info", nullable = false, length = Integer.MAX_VALUE)
    private String brandInfo;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "brand", fetch = FetchType.EAGER)
    private Set<Product> products = new LinkedHashSet<>();

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getBrandName() {
        return brandName;
    }

    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }

    public String getLogoPublicId() {
        return logoPublicId;
    }

    public void setLogoPublicId(String logoPublicId) {
        this.logoPublicId = logoPublicId;
    }

    public String getBrandInfo() {
        return brandInfo;
    }

    public void setBrandInfo(String brandInfo) {
        this.brandInfo = brandInfo;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Set<Product> getProducts() {
        return products;
    }

    public void setProducts(Set<Product> products) {
        this.products = products;
    }

}