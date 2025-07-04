package org.yellowcat.backend.online_selling.oder_online.dto;

import lombok.Builder;
import lombok.Data;
import org.yellowcat.backend.online_selling.order_item_online.OrderItemOnlineDTO;
import org.yellowcat.backend.product.shippingMethod.ShippingMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Builder
@Data
public class OrderOnlineDetailDTO {
    private Integer orderId;
    private String orderCode;
    private String orderStatus;
    private String customerName;
    private String phoneNumber;
    private String wardCommune;
    private String streetAddress;
    private String district;
    private String cityProvince;
    private String country;
    private LocalDateTime orderDate;
    private BigDecimal subTotal;
    private BigDecimal shippingFee;
    private BigDecimal finalAmount;
    private String paymentStatus;
    private String paymentMethod;

    private List<OrderItemOnlineDTO> items;
}
