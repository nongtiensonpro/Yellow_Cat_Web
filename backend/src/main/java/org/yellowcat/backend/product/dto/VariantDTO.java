package org.yellowcat.backend.product.dto;

import java.math.BigDecimal;

public class VariantDTO {
    private Integer variantId;
    private String sku;
    private BigDecimal price;
    private Integer stockLevel;
    private String imageUrl;
    private Double weight;
    private String variantAttributes;

    // Getters and Setters
    public Integer getVariantId() {
        return variantId;
    }

    public void setVariantId(Integer variantId) {
        this.variantId = variantId;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStockLevel() {
        return stockLevel;
    }

    public void setStockLevel(Integer stockLevel) {
        this.stockLevel = stockLevel;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public String getVariantAttributes() {
        return variantAttributes;
    }

    public void setVariantAttributes(String variantAttributes) {
        this.variantAttributes = variantAttributes;
    }
}