package org.yellowcat.backend.vnpay.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class VNPayCreatePaymentRequest {
    @NotNull(message = "Amount is required")
    @Min(value = 1000, message = "Minimum amount is 1000 VND")
    private Long amount;


    private String orderInfo;

    @NotBlank(message = "Order type is required")
    private String orderType;

    private String language;

    @NotBlank(message = "Return URL is required")
    private String returnUrl;

    public Long getAmount() {
        return amount;
    }

    public String getOrderInfo() {
        return orderInfo;
    }

    public String getOrderType() {
        return orderType;
    }

    public String getLanguage() {
        return language;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

}