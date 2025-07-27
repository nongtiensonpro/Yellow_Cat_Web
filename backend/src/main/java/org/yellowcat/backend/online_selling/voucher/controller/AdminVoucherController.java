package org.yellowcat.backend.online_selling.voucher.controller;


import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.online_selling.voucher.VoucherService1;
import org.yellowcat.backend.online_selling.voucher.dto.*;
import org.yellowcat.backend.online_selling.voucher.entity.Voucher;
import org.yellowcat.backend.online_selling.voucher.entity.VoucherScope;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/vouchers")
public class AdminVoucherController {
    @Autowired
    private VoucherService1 voucherService;

    // Lấy tất cả voucher
    @GetMapping
    public List<VoucherSummaryDTO> getAllVouchers() {
        return voucherService.getAllVouchers();
    }


    @GetMapping("/period")
    public List<VoucherSummaryAllDTO> getVouchersByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return voucherService.getAllVouchersByPeriod(startDate, endDate);
    }

    /**
     * Tạo mới voucher
     */
    @PostMapping("/creat")
    public ResponseEntity<?> createVoucher(@RequestBody Voucher voucher) {
        System.out.println("====> chạy controller tạo voucher");

        try {
            Voucher createdVoucher = voucherService.createVoucher(voucher, voucher.getScopes());
            return ResponseEntity.ok(createdVoucher);
        } catch (IllegalArgumentException e) {
            // Trả về lỗi 400 Bad Request khi dữ liệu không hợp lệ
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Dữ liệu không hợp lệ: " + e.getMessage());
        } catch (Exception e) {
            // Trả về lỗi 500 Internal Server Error nếu có lỗi hệ thống
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tạo voucher: " + e.getMessage());
        }
    }



    /**
     * Lấy thông tin voucher theo ID cho admin
     */
    @GetMapping("/detail_admin/{id}")
    public ResponseEntity<VoucherDetailDTO> getVoucherById(@PathVariable Integer id) {
        VoucherDetailDTO voucher = voucherService.getVoucherById(id);
        return ResponseEntity.ok(voucher);
    }

    /**
     * Lấy voucher theo mã code
     * GET /api/vouchers/code?value=VC123ABC
     */
    @GetMapping("/code")
    public ResponseEntity<?> getVoucherByCode(@RequestParam("value") String code) {
        try {
            Voucher voucher = voucherService.getVoucherByCode(code);
            return ResponseEntity.ok(voucher);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy voucher với mã: " + code);
        }
    }

    /**
     * Cập nhật voucher
     */
    @PutMapping("/update")
    public ResponseEntity<?> updateVoucher(@RequestBody Voucher updateDTO) {
        try {
            voucherService.updateVoucher(updateDTO);
            return ResponseEntity.ok("Cập nhật voucher thành công!");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy voucher với ID: " + updateDTO.getId());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi khi cập nhật voucher: " + e.getMessage());
        }
    }


//    /**
//     * Xóa mềm voucher (đánh dấu không hoạt động)
//     */
//    @DeleteMapping("/{id}/soft")
//    public ResponseEntity<Void> softDeleteVoucher(@PathVariable int id) {
//        voucherService.softDeleteVoucher(id);
//        return ResponseEntity.noContent().build();
//    }

    /**
     * Lấy voucher theo trạng thái hoạt động
     */
    @GetMapping("/status")
    public List<VoucherSummaryAllDTO> getVouchersByStatus(@RequestParam boolean isActive) {
        return voucherService.getAllVouchersByStatus(isActive);
    }

    //hính giá trả ra sau khi áp dụng voucher
    @GetMapping("/preview-discount")
    public ResponseEntity<?> previewDiscountedAmount(
            @RequestParam String code,
            @RequestParam BigDecimal subtotal,
            @RequestParam BigDecimal shippingFee
    ) {
        try {
            BigDecimal finalAmount = voucherService.calculateDiscountedAmount(code, subtotal, shippingFee);
            return ResponseEntity.ok(finalAmount);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Voucher với mã '" + code + "' không tồn tại.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tính toán giảm giá: " + e.getMessage());
        }
    }

    //hien thi so tien duoc giam
    @GetMapping("/totle-discount")
    public ResponseEntity<?> previewDiscount(
            @RequestParam String code,
            @RequestParam BigDecimal subtotal,
            @RequestParam BigDecimal shippingFee
    ) {
        try {
            BigDecimal finalAmount = voucherService.calculateAmountAfterDiscout(code, subtotal, shippingFee);
            return ResponseEntity.ok(finalAmount);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Voucher với mã '" + code + "' không tồn tại.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tính toán giảm giá: " + e.getMessage());
        }
    }


    @GetMapping("/detail_voucher_order")
    public ResponseEntity<VoucherReponseDTO> getVoucherDetail(@RequestBody VoucherDetailUserRequest request) {
        VoucherReponseDTO response = voucherService.getVoucherDetailForUser(
                request.getVoucherId(),
                request.getUserId(),
                request.getProductIds(),
                request.getOrderTotal()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user_get_list_vouchers")
    public ResponseEntity<List<VoucherSummaryDTO>> getAvailableVouchers(
            @RequestBody VoucherDetailUserRequest request) {

        List<VoucherSummaryDTO> vouchers = voucherService.getAvailableVoucherSummariesForUser(
                request.getUserId(),
                request.getProductIds(),
                request.getOrderTotal()
        );

        return ResponseEntity.ok(vouchers);

    }
}


