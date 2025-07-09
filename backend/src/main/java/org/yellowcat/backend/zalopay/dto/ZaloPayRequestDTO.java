package org.yellowcat.backend.zalopay.dto;

import lombok.Data;

import java.util.List;

@Data
public class ZaloPayRequestDTO {
    private String userId;
    private String orderId;
    private Long totalAmount;
    private List<ZaloPayItem> items;
}
