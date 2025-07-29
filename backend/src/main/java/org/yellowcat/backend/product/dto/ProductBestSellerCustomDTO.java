package org.yellowcat.backend.product.dto; // Adjust package as necessary

import java.math.BigDecimal; // For price, which can be decimal

public interface ProductBestSellerCustomDTO {
    Integer getProductId();
    String getProductName();
    String getThumbnail();
    Long getTotalSoldUnits(); // Use Long as SUM can result in large numbers, and COALESCE(SUM, 0) makes it non-null
    BigDecimal getPrice(); // Use BigDecimal for monetary values
    String getSizes(); // The concatenated string of sizes
}