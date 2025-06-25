package org.yellowcat.backend.shoppingOnline;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    SHIPPING,
    DELIVERED,
    DELIVERY_FAILED_1,
    DELIVERY_FAILED_2,
    DELIVERY_FAILED_3,
    RETURN_REQUESTED,
    RETURNED,
    REFUNDED,
    RETURNED_TO_SELLER,
    COMPLETED,
    CANCELLED;

    public static OrderStatus fromString(String status) {
        try {
            return OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }
    }
}
