package org.yellowcat.backend.product.returnRequest.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReturnImageResponse {
    private Integer returnImageId;
    private String imageUrl;
    private String description;
    private LocalDateTime uploadedAt;

}
