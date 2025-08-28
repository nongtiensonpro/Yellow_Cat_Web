package org.yellowcat.backend.product.brand.dto;

import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.brand.Brand;

import java.time.Instant;
import java.util.Set;
import java.util.stream.Collectors;

public class BrandDTO {
    private Integer id;
    private String brandName;
    private String logoPublicId;
    private String brandInfo;
    private Boolean status;
    private Instant createdAt;
    private Instant updatedAt;
    private Set<Integer> productIds;


    public BrandDTO(Brand brand) {
        this.id = brand.getId();
        this.brandName = brand.getBrandName();
        this.logoPublicId = brand.getLogoPublicId();
        this.brandInfo = brand.getBrandInfo();
        this.status = brand.getStatus();
        this.createdAt = brand.getCreatedAt();
        this.updatedAt = brand.getUpdatedAt();
        this.productIds = brand.getProducts().stream()
                .map(Product::getProductId)
                .collect(Collectors.toSet());
    }


    public BrandDTO() {
    }

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

    public Set<Integer> getProductIds() {
        return productIds;
    }

    public void setProductIds(Set<Integer> productIds) {
        this.productIds = productIds;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }
}