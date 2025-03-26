package org.yellowcat.backend.vnpay.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.vnpay.dto.VNPayCreatePaymentRequest;
import org.yellowcat.backend.vnpay.dto.VNPayResponse;
import org.yellowcat.backend.vnpay.service.VNPayService;
import java.io.UnsupportedEncodingException;
import java.util.Map;

@RestController
@RequestMapping("/api/vnpay")
public class VNPayController {
    private final VNPayService vnPayService;

    public VNPayController(VNPayService vnPayService) {
        this.vnPayService = vnPayService;
    }

    @PostMapping("/create-payment")
    @Operation(summary = "Tạo một khoản thanh toán mới", description = "Điểm cuối này tạo một khoản thanh toán mới trên VNPAY với thông tin đã cung cấp.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Khoản thanh toán đã được tạo thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ - Thông tin thanh toán không hợp lệ")
    })
    public ResponseEntity<VNPayResponse> createPayment(@Valid @RequestBody VNPayCreatePaymentRequest request) throws UnsupportedEncodingException {
        return ResponseEntity.ok(vnPayService.createPayment(request));
    }

    @GetMapping("/payment-callback")
    @Operation(summary = "Xử lý trả về thanh toán", description = "Điểm cuối này xử lý trả về thanh toán từ VNPAY và cập nhật trạng thái đơn hàng tương ứng.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Trả về thanh toán đã được xử lý thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ - Thông tin trả về không hợp lệ")
    })
    public ResponseEntity<VNPayResponse> paymentCallback(@RequestParam Map<String, String> queryParams) {
        System.out.println(queryParams.toString());
        System.out.println("Return URL: " + queryParams.get("returnUrl") + " - Transaction ID: " + queryParams.get("transaction_id"));
        return ResponseEntity.ok(vnPayService.processPaymentReturn(queryParams));
    }
}