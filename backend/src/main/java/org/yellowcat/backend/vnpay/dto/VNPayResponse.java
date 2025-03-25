package org.yellowcat.backend.vnpay.dto;

public class VNPayResponse {
    private String status;
    private String message;
    private String url;
    private String orderInfo;
    private Long amount;
    private String transactionId;
    private String paymentTime;
    private String transactionStatus;

    public VNPayResponse(String status, String message, String url) {
        this.status = status;
        this.message = message;
        this.url = url;
    }
    public VNPayResponse(String status, String message) {
        this.status = status;
        this.message = message;
    }

    public VNPayResponse(String status, String message, String orderInfo, Long amount, String transactionId, String paymentTime, String transactionStatus) {
        this.status = status;
        this.message = message;
        this.orderInfo = orderInfo;
        this.amount = amount;
        this.transactionId = transactionId;
        this.paymentTime = paymentTime;
        this.transactionStatus = transactionStatus;
    }

    public String getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public String getUrl() {
        return url;
    }

    public String getOrderInfo() {
        return orderInfo;
    }

    public Long getAmount() {
        return amount;
    }

    public String getTransactionId() {
        return transactionId;
    }


    public String getPaymentTime() {
        return paymentTime;
    }

    public String getTransactionStatus() {
        return transactionStatus;
    }

    public Throwable getPaymentUrl() {
        return new RuntimeException("Payment URL not available");
    }
}