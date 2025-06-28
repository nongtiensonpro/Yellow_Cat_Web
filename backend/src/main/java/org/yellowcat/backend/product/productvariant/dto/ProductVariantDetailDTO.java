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
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantDetailDTO {
    private Integer variantId;
    private String productName;
    private String brandName;
    private String colorName;
    private String sizeName;
    private BigDecimal price;
    private BigDecimal salePrice;
}
