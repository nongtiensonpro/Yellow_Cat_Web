package org.yellowcat.backend.product.returnRequest.dto.request;

import lombok.Data;

@Data
public class UpdateReturnStatusDTO {
    private String status; // Approved, Rejected, Completed
    private String note;
}
