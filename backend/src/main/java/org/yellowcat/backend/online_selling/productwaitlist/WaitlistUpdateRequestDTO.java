package org.yellowcat.backend.online_selling.productwaitlist;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WaitlistUpdateRequestDTO {
    private WaitlistStatus newStatus;
    private boolean isAdmin;
    private List<WaitlistItemUpdateDTO> items;
}
