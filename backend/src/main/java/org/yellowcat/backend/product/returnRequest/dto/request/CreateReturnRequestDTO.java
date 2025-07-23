package org.yellowcat.backend.product.returnRequest.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class CreateReturnRequestDTO {
    private Integer orderId;
    private Integer appUserId;
    private String returnReason;
    private List<ReturnItemDTO> items;
}