package org.yellowcat.backend.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailDTO {
    private Integer productId;
    private String productName;
    private String description;
    private Integer materialId;
    private Integer targetAudienceId;
    private Integer purchases;
    private Boolean isActive;
    private Integer categoryId;
    private String categoryName;
    private Integer brandId;
    private String brandName;
    private String brandInfo;
    private String logoPublicId;
    private String thumbnail;
    private List<ProductVariantDTO> variants;
}