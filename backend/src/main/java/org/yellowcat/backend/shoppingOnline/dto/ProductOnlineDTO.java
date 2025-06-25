package org.yellowcat.backend.shoppingOnline.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class ProductOnlineDTO {
    private Integer id;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

}
