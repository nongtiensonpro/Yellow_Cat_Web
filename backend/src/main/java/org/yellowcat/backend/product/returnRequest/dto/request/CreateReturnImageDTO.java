package org.yellowcat.backend.product.returnRequest.dto.request;

import lombok.Data;

@Data
public class CreateReturnImageDTO {
    private Integer returnItemId;
    private String imageUrl;
    private String description;
}