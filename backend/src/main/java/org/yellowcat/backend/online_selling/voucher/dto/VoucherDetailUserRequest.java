package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class VoucherDetailUserRequest {
    private Integer userId;
    private Integer voucherId;
    private List<Integer> productIds;
    private BigDecimal orderTotal;
}
