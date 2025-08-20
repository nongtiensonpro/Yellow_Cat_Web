package org.yellowcat.backend.online_selling.voucher.controller;


import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.online_selling.voucher.DiscountType;
import org.yellowcat.backend.online_selling.voucher.ScopeType;
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

    // API giúp lọc theo kểu giảm giá hoạc phạm vi
    @GetMapping("/discount-type")
    public List<VoucherSummaryAllDTO> getAllVouchersByDiscountType(@RequestParam String discountType) {
        DiscountType type;
        switch (discountType.toLowerCase()) {
            case "percentage":
            case "percent":
                type = DiscountType.PERCENT;
                break;
            case "fixed_amount":
            case "fixed":
                type = DiscountType.FIXED_AMOUNT;
                break;
            case "free_shipping":
            case "free":
                type = DiscountType.FREE_SHIPPING;
                break;
            default:
                throw new IllegalArgumentException("Loại giảm giá không hợp lệ: " + discountType);
        }
        return voucherService.getAllVouchersDiscountType(type);
    }

    @GetMapping("/scope-type")
    public List<VoucherSummaryAllDTO> getAllVouchersByScopeType(@RequestParam String scopeType) {
        System.out.println("=== getAllVouchersByScopeType ===");
        System.out.println("Requested scopeType: '" + scopeType + "'");
        
        ScopeType type;
        switch (scopeType.toLowerCase()) {
            case "specific_category":
            case "category":
                type = ScopeType.PRODUCT_CATEGORY;
                break;
            case "specific_products":
            case "specific_product":
            case "products":
                type = ScopeType.SPECIFIC_PRODUCTS;
                break;
            case "specific_users":
            case "specific_user":
            case "users":
                type = ScopeType.SPECIFIC_USERS;
                break;
            case "all_products":
                type = ScopeType.ALL_PRODUCTS;
                break;
            default:
                throw new IllegalArgumentException("Loại phạm vi không hợp lệ: " + scopeType);
        }
        
        System.out.println("Mapped to ScopeType: " + type);
        List<VoucherSummaryAllDTO> result = voucherService.getAllVouchersScopeType(type);
        System.out.println("Result count: " + result.size());
        System.out.println("=== End getAllVouchersByScopeType ===");
        
        return result;
    }

    // Giữ lại các API cũ để tương thích ngược
    @GetMapping("/discout_persent")
    public List<VoucherSummaryAllDTO> getAllVouchersDiscoutPresent() {
        return voucherService.getAllVouchersDiscountType(DiscountType.PERCENT);
    }

    @GetMapping("/fix_amount")
    public List<VoucherSummaryAllDTO> getAllVouchersFixAmount() {
        return voucherService.getAllVouchersDiscountType(DiscountType.FIXED_AMOUNT);
    }

    @GetMapping("/free_ship")
    public List<VoucherSummaryAllDTO> getAllVouchersFreeShip() {
        return voucherService.getAllVouchersDiscountType(DiscountType.FREE_SHIPPING);
    }

    @GetMapping("/specific_category")
    public List<VoucherSummaryAllDTO> getAllVouchersCategory() {
        return voucherService.getAllVouchersScopeType(ScopeType.PRODUCT_CATEGORY);
    }

    @GetMapping("/specific_product")
    public List<VoucherSummaryAllDTO> getAllVouchersProduct() {
        return voucherService.getAllVouchersScopeType(ScopeType.SPECIFIC_PRODUCTS);
    }

    @GetMapping("/specific_user")
    public List<VoucherSummaryAllDTO> getAllVouchersUser() {
        return voucherService.getAllVouchersScopeType(ScopeType.SPECIFIC_USERS);
    }


    @GetMapping("/period")
    public List<VoucherSummaryAllDTO> getVouchersByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        System.out.println("=== getVouchersByPeriod ===");
        System.out.println("StartDate: " + startDate);
        System.out.println("EndDate: " + endDate);
        
        List<VoucherSummaryAllDTO> result = voucherService.getAllVouchersByPeriod(startDate, endDate);
        System.out.println("Result count: " + result.size());
        System.out.println("Result: " + result);
        
        // Log JSON response để debug
        try {
            ObjectMapper mapper = new ObjectMapper();
            String jsonResult = mapper.writeValueAsString(result);
            System.out.println("JSON Response: " + jsonResult);
        } catch (Exception e) {
            System.out.println("Error serializing to JSON: " + e.getMessage());
        }
        
        System.out.println("=== End getVouchersByPeriod ===");
        
        return result;
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

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<?> deactivateVoucher(@PathVariable Integer id) {
        try {
            voucherService.deactivateVoucher(id);
            return ResponseEntity.ok("Voucher đã bị vô hiệu");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy voucher với ID: " + id);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi không xác định: " + e.getMessage());
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

    // lấy danh sách người dũng đã sử dụng voucher
    @GetMapping("/{voucherId}/usage")
    public ResponseEntity<VoucherUsageDTO> getVoucherUsageDetails(
            @PathVariable Integer voucherId) {
        VoucherUsageDTO usageDetails = voucherService.getVoucherUsageDetails(voucherId);
        return ResponseEntity.ok(usageDetails);
    }

    // thống kê hiệu suất
    @GetMapping("/{id}/performance-stats")
    public ResponseEntity<VoucherPerformanceDTO> getVoucherPerformanceStats(
            @PathVariable Integer id,
            @RequestParam(name = "page", required = false, defaultValue = "1") Integer page,
            @RequestParam(name = "pageSize", required = false, defaultValue = "7") Integer pageSize
    ) {
        VoucherPerformanceDTO stats = voucherService.getVoucherPerformanceStats(id, page, pageSize);
        return ResponseEntity.ok(stats);
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

    /**
     * Lấy voucher theo trạng thái cụ thể
     */
    @GetMapping("/status-filter")
    public List<VoucherSummaryAllDTO> getVouchersByStatusFilter(@RequestParam String status) {
        return voucherService.getAllVouchersByStatusFilter(status);
    }

    //tính giá trả ra sau khi áp dụng voucher
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
        System.out.println("=== /totle-discount API ===");
        System.out.println("Code: " + code);
        System.out.println("Subtotal: " + subtotal);
        System.out.println("ShippingFee: " + shippingFee);
        
        try {
            BigDecimal finalAmount = voucherService.calculateAmountAfterDiscout(code, subtotal, shippingFee);
            System.out.println("API Response: " + finalAmount);
            System.out.println("=== End /totle-discount API ===");
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

    @PostMapping("/user_get_list_vouchers")
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


