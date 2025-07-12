package org.yellowcat.backend.online_selling.card_online.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Builder
@Data
public class ConfirmCartRequestDTO {
    private UUID keycloakId;
    private List<ProductConfirmDTO> products;
    private boolean allowWaitingOrder;
}
