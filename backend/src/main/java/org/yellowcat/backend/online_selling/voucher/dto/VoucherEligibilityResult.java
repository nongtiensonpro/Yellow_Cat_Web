package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherEligibilityResult {
    private boolean eligible = true; // mặc định hợp lệ
    private List<String> failureReasons = new ArrayList<>(); // tránh null
    private String message; // thêm trường message

    public void addFailureReason(String reason) {
        this.failureReasons.add(reason);
        this.eligible = false;
    }

    public void markEligible() {
        this.eligible = true;
        this.message = "Đủ điều kiện áp dụng";
    }
}
