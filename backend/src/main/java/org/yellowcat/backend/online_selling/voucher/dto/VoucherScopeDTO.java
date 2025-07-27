package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.Data;
import org.yellowcat.backend.online_selling.voucher.ScopeType;

import java.util.List;

@Data
public class VoucherScopeDTO {
    private ScopeType scopeType;
    private List<String> targetNames;
}
