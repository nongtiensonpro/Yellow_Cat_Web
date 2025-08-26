package org.yellowcat.backend.online_selling.orderTimeline.dto;


import jakarta.persistence.Column;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Builder
@Data
public class DetailOrderTimeLine {

    private Long id;


    private Integer orderId;


    private String fromStatus;


    private String toStatus;


    private String note;


    private LocalDateTime changedAt;


    private String updatedBy;

    private String emailUserUpdate;
}
