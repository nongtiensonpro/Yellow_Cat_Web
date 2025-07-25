//package org.yellowcat.backend.product.productvariant.dto;
//
//import lombok.AllArgsConstructor;
//import lombok.Data;
//import lombok.NoArgsConstructor;
//
//import java.math.BigDecimal;
//
//@Data
//@NoArgsConstructor
//@AllArgsConstructor
//public class ProductVariantDetailDTO {
//    private Integer variantId;
//    private String productName;
//    private String brandName;
//    private String colorName;
//    private String sizeName;
//    private BigDecimal price;
//    private BigDecimal salePrice;
//}


package org.yellowcat.backend.product.productvariant.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
// @NoArgsConstructor
// @AllArgsConstructor
public class ProductVariantDetailDTO {
    private Integer variantId;
    private String productName;
    private String brandName;
    private String colorName;
    private String sizeName;
    private String materialName; // Thêm trường này
    private BigDecimal price;
    private BigDecimal salePrice;

    public ProductVariantDetailDTO() {}

    public ProductVariantDetailDTO(
        Integer variantId,
        String productName,
        String brandName,
        String colorName,
        String sizeName,
        String materialName, // Thêm vào constructor
        BigDecimal price,
        BigDecimal salePrice
    ) {
        this.variantId = variantId;
        this.productName = productName;
        this.brandName = brandName;
        this.colorName = colorName;
        this.sizeName = sizeName;
        this.materialName = materialName;
        this.price = price;
        this.salePrice = salePrice;
    }
}
