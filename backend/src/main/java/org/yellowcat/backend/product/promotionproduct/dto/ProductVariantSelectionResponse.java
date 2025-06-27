package org.yellowcat.backend.product.promotionproduct.dto;

import java.math.BigDecimal;

public class ProductVariantSelectionResponse {
    private Integer variantId;
    private String sku;
    private BigDecimal price;
    private BigDecimal salePrice;
    private String imageUrl;
    private String productName;

    public ProductVariantSelectionResponse(Integer variantId, String sku,
                                           BigDecimal price, BigDecimal salePrice,
                                           String imageUrl, String productName) {
        this.variantId = variantId;
        this.sku = sku;
        this.price = price;
        this.salePrice = salePrice;
        this.imageUrl = imageUrl;
        this.productName = productName;
    }

    public Integer getVariantId() { return variantId; }
    public String getSku() { return sku; }
    public BigDecimal getPrice() { return price; }
    public BigDecimal getSalePrice() { return salePrice; }
    public String getImageUrl() { return imageUrl; }
    public String getProductName() { return productName; }
}
