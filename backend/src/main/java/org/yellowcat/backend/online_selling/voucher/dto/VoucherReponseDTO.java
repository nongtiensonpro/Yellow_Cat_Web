package org.yellowcat.backend.online_selling.voucher.dto;

import lombok.Data;
import org.yellowcat.backend.online_selling.voucher.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class VoucherReponseDTO {
    private Integer id;                 // ID voucher
    private String code;                // Mã voucher (unique)
    private String name;                // Tên
    private String description;         // Mô tả voucher

    private DiscountType discountType;  // Loại giảm giá
    private BigDecimal discountValue;   // Giá trị giảm giá

    private LocalDateTime startDate;    // Ngày bắt đầu hiệu lực
    private LocalDateTime endDate;      // Ngày kết thúc hiệu lực

    private Integer maxUsage;           // Số lượt sử dụng tối đa
    private Integer usageCount;         // Số lượt đã sử dụng

    private BigDecimal minOrderValue;   // Giá trị đơn hàng tối thiểu
    private BigDecimal maxDiscountAmount; // Giảm giá tối đa (nếu có)

    private Boolean isActive;           // Trạng thái kích hoạt
    private LocalDateTime createdAt;    // Ngày tạo voucher

    // Thông tin thêm để hiển thị
    private Integer remainingUsage;     // Số lượt còn lại
    private Boolean isEligible;         // Có đủ điều kiện sử dụng không
    private List<String> status;              // Trạng thái hiển thị
    private Boolean isUsed;     // true = đã dùng, false = chưa dùng
    private String usedStatus;  // "Đã sử dụng" / "Chưa sử dụng"

    private List<VoucherScopeDTO> scopes;
}
