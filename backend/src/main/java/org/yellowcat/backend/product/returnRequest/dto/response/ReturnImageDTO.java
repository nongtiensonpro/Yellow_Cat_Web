package org.yellowcat.backend.product.returnRequest.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReturnImageDTO {
    private Integer returnImageId;
    private String imageUrl;
    private String description;
}