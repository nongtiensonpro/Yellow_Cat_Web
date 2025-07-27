package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VoucherSummaryDTO {
    private int id;
    private String code;
    private String name;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private String usedStatus;
    private boolean eligible;
}
