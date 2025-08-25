package org.yellowcat.backend.online_selling.voucher.dto;

import java.math.BigDecimal;

/**
 * DTO cho request áp dụng voucher trong office sales
 */
public class ApplyVoucherRequest {
    private String voucherCode;
    private String orderCode;
    private Integer userId;
    private BigDecimal discountAmount;

    // Constructors
    public ApplyVoucherRequest() {}

    public ApplyVoucherRequest(String voucherCode, String orderCode, Integer userId, BigDecimal discountAmount) {
        this.voucherCode = voucherCode;
        this.orderCode = orderCode;
        this.userId = userId;
        this.discountAmount = discountAmount;
    }

    // Getters and Setters
    public String getVoucherCode() {
        return voucherCode;
    }

    public void setVoucherCode(String voucherCode) {
        this.voucherCode = voucherCode;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    @Override
    public String toString() {
        return "ApplyVoucherRequest{" +
                "voucherCode='" + voucherCode + '\'' +
                ", orderCode='" + orderCode + '\'' +
                ", userId=" + userId +
                ", discountAmount=" + discountAmount +
                '}';
    }
}
