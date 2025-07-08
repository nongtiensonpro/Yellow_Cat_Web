package org.yellowcat.backend.online_selling.productwaitlist;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class WaitlistItemUpdateDTO {
    private Integer variantId;
    private Integer desiredQuantity;
}
