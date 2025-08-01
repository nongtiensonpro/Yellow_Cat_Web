package org.yellowcat.backend.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductListItemDTO {
    private Integer productId;
    private String productName;
    private Integer purchases;
    private String categoryName;
    private String brandName;
    private String logoPublicId;
    private BigDecimal minPrice;
    private BigDecimal minSalePrice;
    private Long totalStock;
    private String thumbnail;

    private String sizesStr;
    private String colorsStr;
}