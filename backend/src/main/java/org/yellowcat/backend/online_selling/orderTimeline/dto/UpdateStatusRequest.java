package org.yellowcat.backend.online_selling.orderTimeline.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UpdateStatusRequest {
    private Integer orderId;
    private String newStatus;
    private String note;
    private List<String> imageUrls;
    private  UUID keycloakid;
}
