package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.Data;
import org.yellowcat.backend.online_selling.voucher.entity.VoucherScope;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class VoucherUpdateReponseDTO {
    private Integer id;
    private String description;
    private String discountType;
    private Double discountValue;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private List<VoucherScope> scopes;
}
