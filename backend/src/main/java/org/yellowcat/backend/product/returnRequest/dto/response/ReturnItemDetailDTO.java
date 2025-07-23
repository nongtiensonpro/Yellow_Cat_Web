package org.yellowcat.backend.product.returnRequest.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ReturnItemDetailDTO {
    private Integer returnItemId;
    private Integer orderItemId;
    private String productName;
    private String sku;
    private String color;
    private String size;
    private Integer quantityReturned;
    private BigDecimal refundAmount;
    private String reason;
    private List<ReturnImageDTO> images;
}