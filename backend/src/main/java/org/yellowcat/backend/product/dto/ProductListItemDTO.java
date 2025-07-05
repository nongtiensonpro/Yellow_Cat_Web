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
    private BigDecimal minSalePrice; // ⬅️ Thêm dòng này
    private Long totalStock;
    private Long totalStockOnline;
    private String thumbnail;
}