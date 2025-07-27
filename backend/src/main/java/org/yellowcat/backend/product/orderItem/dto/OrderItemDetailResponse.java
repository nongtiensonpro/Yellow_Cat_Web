package org.yellowcat.backend.product.orderItem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDetailResponse {
    // Thông tin order item
    private Integer orderItemId;
    private Integer orderId;
    private Integer quantity;
    private BigDecimal priceAtPurchase;
    private BigDecimal totalPrice;
    
    // Thông tin product variant
    private Integer variantId;
    private String sku;
    private String productName;
    private String colorName;
    private String sizeName;
    private String materialName;
    private String brandName;
    private String categoryName;
    private String targetAudienceName;
    private BigDecimal currentPrice;
    private BigDecimal salePrice;
    private String imageUrl;
    private Double weight;
    private Integer quantityInStock;

    // Khuyến mãi áp dụng (nếu có)
    private String promotionCode;
    private String promotionName;
    private java.math.BigDecimal discountAmount;
    private java.math.BigDecimal originalPrice;
} 