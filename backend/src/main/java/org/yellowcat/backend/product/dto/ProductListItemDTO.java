package org.yellowcat.backend.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductListItemDTO {
    private Integer productId;
    private String productName;
    private String description;
    private Integer purchases;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private Boolean isActive;
    private Integer categoryId;
    private String categoryName;
    private Integer brandId;
    private String brandName;
    private String brandInfo;
    private String logoPublicId;
    private BigDecimal minPrice;
    private Long totalStock;
    private String thumbnail;
    private String activePromotions;
}