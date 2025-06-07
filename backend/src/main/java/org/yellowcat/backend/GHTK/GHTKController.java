package org.yellowcat.backend.GHTK;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.GHTK.dto.CreatOrderRequest;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;

@RestController
@RequestMapping("/api/ghtk")
public class GHTKController {
    @Autowired
    private ObjectMapper objectMapper;

    private final GHTKService ghtkService;

    public GHTKController(GHTKService ghtkService) {
        this.ghtkService = ghtkService;
    }



    @PostMapping("/orders")
    public ApiResponse<JsonNode> createOrder(@RequestBody CreatOrderRequest orderRequest) {
        return ghtkService.createOrder(orderRequest);
    }

    @GetMapping("/fee")
    public ResponseEntity<ApiResponse<Integer>> getFee(
            @RequestParam String province,
            @RequestParam String district,
            @RequestParam int weight,
            @RequestParam int value) {

        ApiResponse<Integer> response = ghtkService.getShippingFee(province, district, weight, value);

        return ResponseEntity
                .status(response.getStatus())
                .body(response);
    }

    @PostMapping("/cancel/{trackingOrder}")
    public ApiResponse<String> cancelOrder(@PathVariable String trackingOrder) {
        return ghtkService.cancelOrder(trackingOrder);
    }

    @SuppressWarnings("unchecked")
    @GetMapping("/order-status/{label}")
    public ResponseEntity<ApiResponse<?>> getOrderStatus(@PathVariable String label) {
        return (ResponseEntity<ApiResponse<?>>) (ResponseEntity<?>) ghtkService.getOrderStatus(label);
    }

    @GetMapping("/print_oder/label/{trackingOrder}")
    public ResponseEntity<?> getLabel(
            @PathVariable String trackingOrder,
            @RequestParam(required = false) String original,
            @RequestParam(required = false, name = "paper_size") String paperSize) {

        return ghtkService.getLabel(trackingOrder, original, paperSize);
    }






}
