package org.yellowcat.backend.product.cart.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ConfirmCartRequestDTO {
    private UUID keycloakId;
    private List<ProductConfirmDTO> products;
}
