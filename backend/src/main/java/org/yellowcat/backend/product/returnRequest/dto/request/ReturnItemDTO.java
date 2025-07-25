package org.yellowcat.backend.product.returnRequest.dto.request;

import lombok.Data;

@Data
public class ReturnItemDTO {
    private Integer orderItemId;
    private Integer quantityReturned;
    private String reason;
}