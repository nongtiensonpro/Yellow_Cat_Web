package org.yellowcat.backend.product.returnRequest.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ReturnRequestResponse {
    private Integer returnRequestId;
    private String orderCode;
    private String username;
    private LocalDateTime requestDate;
    private String returnReason;
    private String status;
    private BigDecimal refundAmount;
    private LocalDateTime processedDate;
    private String note;
}
