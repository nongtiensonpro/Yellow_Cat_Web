package org.yellowcat.backend.zalopay;

import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.online_selling.oder_online.OrderOnlineService;

import java.util.Map;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/payment")
public class ZaloPayController {

    @Autowired
    private ZaloPayService zaloPayService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final Logger logger = Logger.getLogger(ZaloPayController.class.getName());

    @PostMapping("/create")
    public Map<String, Object> createOrder(@RequestBody Map<String, Object> request) {
        try {
            return zaloPayService.createOrder(request);
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("error", "An error occurred: " + e.getMessage());
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

//    @PostMapping("/callback")
//    public String handleCallback(@RequestBody String jsonStr) throws JSONException {
//        System.out.println("Nhận được dữ liệu callback từ zalo: xác nhạn đơn hàng thành công");
//        logger.info("Received callback: " + jsonStr);
//
//        // Gọi service để xử lý logic callback
//        JSONObject response = zaloPayService.processCallback(jsonStr);
//
//        // Trả về kết quả
//        System.out.println(response.toString());
//
//        return response.toString();
//    }
}
