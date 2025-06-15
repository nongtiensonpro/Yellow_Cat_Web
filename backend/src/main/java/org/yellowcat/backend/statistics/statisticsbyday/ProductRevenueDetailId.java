package org.yellowcat.backend.statistics.statisticsbyday;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

public class ProductRevenueDetailId implements Serializable {
    private LocalDate orderDate;
    private Long productId;
    private Long variantId;
    private String paymentMethod;
    private String orderStatus;
    private String shippingMethod;

    public ProductRevenueDetailId() {}

    public ProductRevenueDetailId(LocalDate orderDate, Long productId, Long variantId,
                                String paymentMethod, String orderStatus, String shippingMethod) {
        this.orderDate = orderDate;
        this.productId = productId;
        this.variantId = variantId;
        this.paymentMethod = paymentMethod;
        this.orderStatus = orderStatus;
        this.shippingMethod = shippingMethod;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProductRevenueDetailId that = (ProductRevenueDetailId) o;
        return Objects.equals(orderDate, that.orderDate) &&
               Objects.equals(productId, that.productId) &&
               Objects.equals(variantId, that.variantId) &&
               Objects.equals(paymentMethod, that.paymentMethod) &&
               Objects.equals(orderStatus, that.orderStatus) &&
               Objects.equals(shippingMethod, that.shippingMethod);
    }

    @Override
    public int hashCode() {
        return Objects.hash(orderDate, productId, variantId, paymentMethod, orderStatus, shippingMethod);
    }

    // Getters and setters
    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Long getVariantId() {
        return variantId;
    }

    public void setVariantId(Long variantId) {
        this.variantId = variantId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getShippingMethod() {
        return shippingMethod;
    }

    public void setShippingMethod(String shippingMethod) {
        this.shippingMethod = shippingMethod;
    }
} 