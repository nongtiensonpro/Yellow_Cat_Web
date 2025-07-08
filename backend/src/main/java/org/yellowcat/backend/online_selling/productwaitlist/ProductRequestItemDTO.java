package org.yellowcat.backend.online_selling.productwaitlist;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductRequestItemDTO {
    private Integer variantId;
    private int desiredQuantity;
}
