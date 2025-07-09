package org.yellowcat.backend.online_selling.productwaitlist;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class WaitlistRequestDTO {
    private UUID keyloackID;
    private String fullName;
    private String phoneNumber;
    private String email;
    private String note;
    private List<ProductRequestItemDTO> items;
}
