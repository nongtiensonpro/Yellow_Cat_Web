package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.Data;

import java.util.List;

@Data
public class VoucherUsageDTO {
    private int totalUsers; // Tổng số người dùng đã sử dụng voucher
    private int totalRedemptions; // Tổng số lần sử dụng
    private List<VoucherUserDetailDTO> userDetails; // Chi tiết từng lần sử dụng
}
