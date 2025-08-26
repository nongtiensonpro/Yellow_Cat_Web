package org.yellowcat.backend.online_selling.oder_online.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.yellowcat.backend.address.Addresses;
import org.yellowcat.backend.online_selling.PaymentStatus;
import org.yellowcat.backend.user.AppUser;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderOnlineRequestDTO {
    private List<ProductOnlineDTO> products;
    private AppUser appUser;
    private String codeOrderInGHK;
    private Addresses shippingAddress;
    private BigDecimal shippingFee;
    private String paymentMethod;
    private String note;
    private boolean isSyncedToGhtk;
    private Integer shippingMethodId;
    private String orderStatus;
    private String codeVoucher;
    private String email;
}
