package org.yellowcat.backend.zalopay;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.product.order.OrderRepository;
import org.yellowcat.backend.product.payment.Payment;
import org.yellowcat.backend.product.payment.PaymentRepository;
import org.yellowcat.backend.zalopay.dto.RefundRequestDTO;

import java.math.BigDecimal;
import java.util.Map;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/payment")
public class ZaloPayController {

    @Autowired
    private ZaloPayService zaloPayService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private OrderRepository orderOnlineService;

    @Autowired
    private PaymentRepository paymentRepository;

    private final Logger logger = Logger.getLogger(ZaloPayController.class.getName());

    @PostMapping("/create")
    public ResponseEntity<?> createZaloPay(@RequestParam("orderCode") String orderCode) {
        try {
            Map<String, Object> result = zaloPayService.createZaloPayOrder(orderCode);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping(value = "/order-status/{appTransId}", produces = "application/json")
    public ResponseEntity<String> getOrderStatus(@PathVariable String appTransId) {
        try {
            JSONObject jsonResponse = zaloPayService.getOrderStatus(appTransId);
            return ResponseEntity.ok(jsonResponse.toString());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("{\"error\": \"An error occurred: " + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleCallback(@RequestBody Map<String, Object> callbackBody) {
        logger.info("Nhận callback từ ZaloPay: " + callbackBody);
        Map<String, Object> response = zaloPayService.processCallback(callbackBody);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refund")
    public ResponseEntity<?> refund(@RequestBody RefundRequestDTO request) {
        try {
            String orderCode = request.getOrderId();
            String reason = request.getReason();
            BigDecimal inputAmount = request.getAmount(); // số tiền người dùng gửi lên

            Payment payment = paymentRepository.findByOrder_OrderCode(orderCode);
            if (payment == null || !"SUCCESS".equalsIgnoreCase(payment.getPaymentStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Không tìm thấy giao dịch hợp lệ để hoàn tiền."
                ));
            }

            //Ngăn không cho hoàn nếu đã hoàn trước đó
            if ("REFUNDED".equalsIgnoreCase(payment.getPaymentStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Giao dịch này đã được hoàn tiền trước đó."
                ));
            }

            String zpTransId = payment.getZpTransId();
            BigDecimal finalAmount = inputAmount != null ? inputAmount : payment.getAmount();

            if (finalAmount == null || finalAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Số tiền hoàn phải lớn hơn 0");
            }

            long amountToRefund;
            try {
                amountToRefund = finalAmount.longValueExact(); // throw nếu có phần thập phân
            } catch (ArithmeticException e) {
                throw new IllegalArgumentException("Số tiền hoàn không hợp lệ: phải là số nguyên", e);
            }

            System.out.println("==== Số tiền được yêu cầu hoàn tiền là: " + amountToRefund);

            Map<String, Object> response = zaloPayService.refundTransaction(zpTransId, amountToRefund, reason);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Đã xảy ra lỗi khi hoàn tiền: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/refund/status")
    public ResponseEntity<?> getRefundStatus(@RequestParam("orderCode") String orderCode) {
        try {
            Map<String, Object> status = zaloPayService.queryRefundStatus(orderCode);
            return ResponseEntity.ok(status);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Lỗi khi truy vấn trạng thái hoàn tiền.", "details", e.getMessage()));
        }
    }

}
