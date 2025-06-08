package org.yellowcat.backend.product.order.mapper;

import org.mapstruct.*;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.order.dto.OrderUpdateResponse;
import org.yellowcat.backend.product.payment.Payment;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    // Chuyển từ Order entity sang OrderUpdateResponse DTO
    OrderUpdateResponse toOrderUpdateResponse(Order order);

    // Chuyển từ Payment entity sang PaymentResponse DTO
    OrderUpdateResponse.PaymentResponse toPaymentResponse(Payment payment);

    // Map list nếu cần
    List<OrderUpdateResponse.PaymentResponse> toPaymentResponseList(List<Payment> payments);
}

