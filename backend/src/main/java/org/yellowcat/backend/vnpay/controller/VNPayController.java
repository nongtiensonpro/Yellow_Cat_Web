package org.yellowcat.backend.vnpay.controller;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<VNPayResponse> createPayment(@Valid @RequestBody VNPayCreatePaymentRequest request) throws UnsupportedEncodingException {
        return ResponseEntity.ok(vnPayService.createPayment(request));
    }

    @GetMapping("/payment-callback")
    public ResponseEntity<VNPayResponse> paymentCallback(@RequestParam Map<String, String> queryParams) {
        System.out.println(queryParams.toString());
        System.out.println("Return URL: " + queryParams.get("returnUrl") + " - Transaction ID: " + queryParams.get("transaction_id"));
        return ResponseEntity.ok(vnPayService.processPaymentReturn(queryParams));
    }
}