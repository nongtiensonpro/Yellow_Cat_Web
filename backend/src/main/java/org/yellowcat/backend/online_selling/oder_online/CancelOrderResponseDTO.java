package org.yellowcat.backend.online_selling.oder_online;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CancelOrderResponseDTO {
    private String orderCode;
    private String status;
    private String message;
}
