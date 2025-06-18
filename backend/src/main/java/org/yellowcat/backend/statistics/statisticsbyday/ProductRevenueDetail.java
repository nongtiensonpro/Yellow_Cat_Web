package org.yellowcat.backend.statistics.statisticsbyday;

import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Immutable
@IdClass(ProductRevenueDetailId.class)
public class ProductRevenueDetail {
    @Id
    @Column(name = "order_date")
    private LocalDate orderDate;
    
    @Id
    @Column(name = "product_id")
    private Long productId;
    
    @Id
    @Column(name = "variant_id")
    private Long variantId;
    
    @Id
    @Column(name = "payment_method")
    private String paymentMethod;
    
    @Id
    @Column(name = "order_status")
    private String orderStatus;
    
    @Id
    @Column(name = "shipping_method")
    private String shippingMethod;
    
    @Column(name = "product_name")
    private String productName;
    
    @Column(name = "category_name")
    private String categoryName;
    
    @Column(name = "brand_name")
    private String brandName;
    
    @Column(name = "total_revenue")
    private BigDecimal totalRevenue;
    
    @Column(name = "total_units_sold")
    private Long totalUnitsSold;
    
    @Column(name = "avg_unit_price")
    private BigDecimal avgUnitPrice;
    
    @Column(name = "orders_count")
    private Long ordersCount;

    public ProductRevenueDetail() {}

    public ProductRevenueDetail(LocalDate orderDate, Long productId, String productName, 
                              Long variantId, String categoryName, String brandName, 
                              String paymentMethod, String orderStatus, String shippingMethod,
                              BigDecimal totalRevenue, Long totalUnitsSold, 
                              BigDecimal avgUnitPrice, Long ordersCount) {
        this.orderDate = orderDate;
        this.productId = productId;
        this.productName = productName;
        this.variantId = variantId;
        this.categoryName = categoryName;
        this.brandName = brandName;
        this.paymentMethod = paymentMethod;
        this.orderStatus = orderStatus;
        this.shippingMethod = shippingMethod;
        this.totalRevenue = totalRevenue;
        this.totalUnitsSold = totalUnitsSold;
        this.avgUnitPrice = avgUnitPrice;
        this.ordersCount = ordersCount;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Long getVariantId() {
        return variantId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public String getBrandName() {
        return brandName;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public String getShippingMethod() {
        return shippingMethod;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public Long getTotalUnitsSold() {
        return totalUnitsSold;
    }

    public BigDecimal getAvgUnitPrice() {
        return avgUnitPrice;
    }

    public Long getOrdersCount() {
        return ordersCount;
    }
} 