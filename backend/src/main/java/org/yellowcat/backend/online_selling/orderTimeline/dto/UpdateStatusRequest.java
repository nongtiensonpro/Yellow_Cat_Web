package org.yellowcat.backend.online_selling.orderTimeline.dto;

import lombok.Data;

import java.util.List;

@Data
public class UpdateStatusRequest {
    private Integer orderId;
    private String newStatus;
    private String note;
    private List<String> imageUrls;
}
