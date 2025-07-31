package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class VoucherUserDetailDTO {
    private Integer userId;
    private String email;
    private String phone;
    private String fullName;
    private LocalDateTime usedAt;
    private BigDecimal discountAmount;
    private BigDecimal orderValue;
    private String orderCode;
    private Integer orderId;
}
