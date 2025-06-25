package org.yellowcat.backend.GHTK;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.yellowcat.backend.GHTK.dto.CreatOrderRequest;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class GHTKService {

    @Value("${ghtk.token: 22U4dBRaIgdIoPMxkMPa9HI33lvfZfpvxVWXO8z}")
    private String ghtkToken;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GHTKService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public ApiResponse<JsonNode> createOrder(CreatOrderRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Token", ghtkToken);
            headers.set("X-Client-Source", "S308157");  // nếu cần

            String url = "https://services.giaohangtietkiem.vn/services/shipment/order/?ver=1.5";

            Map<String, Object> payload = Map.of(
                    "products", request.getProducts(),
                    "order", request.getOrder()
            );

            HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, httpEntity, String.class);
            HttpStatusCode status = response.getStatusCode();

            JsonNode rootNode = objectMapper.readTree(response.getBody());

            if (status.is2xxSuccessful()) {
                boolean success = rootNode.path("success").asBoolean(false);
                if (success) {
                    JsonNode orderNode = rootNode.path("order");
                    return ApiResponse.success("Tạo đơn hàng thành công", orderNode);
                } else {
                    return ApiResponse.error(
                            HttpStatus.BAD_REQUEST,
                            "Tạo đơn thất bại",
                            rootNode.toString()  // ép thành chuỗi để truyền vào field `error` (String)
                    );
                }
            } else {
                return ApiResponse.error(
                        HttpStatus.valueOf(status.value()),
                        "Lỗi khi gọi API GHTK",
                        response.getBody()
                );
            }

        } catch (Exception e) {
            return ApiResponse.error(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Lỗi hệ thống",
                    e.getMessage()
            );
        }
    }





    public ApiResponse<Integer> getShippingFee(String province, String district, double weight, int value, String deliverOption) {
        try {
            // Nhân weight với 50 để lấy đơn vị gram
            int weightGram = (int) (weight * 50);
            String url = String.format(
                    "https://services.giaohangtietkiem.vn/services/shipment/fee?pick_province=Hà Nội&pick_district=Cầu Giấy&province=%s&district=%s&weight=%d&value=%d&deliver_option=%s",
                    province, district, weightGram, value, deliverOption);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghtkToken);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            HttpStatus status = HttpStatus.valueOf(response.getStatusCode().value());
            if (!status.is2xxSuccessful()) {
                return ApiResponse.error(status, "Lỗi khi gọi API GHTK", response.getBody());
            }

            JsonNode root = objectMapper.readTree(response.getBody());

            if (!root.path("success").asBoolean(false)) {
                return ApiResponse.error(HttpStatus.BAD_REQUEST, "API trả về không thành công", response.getBody());
            }

            JsonNode feeNode = root.path("fee").path("fee");
            if (feeNode.isMissingNode()) {
                return ApiResponse.error(HttpStatus.BAD_REQUEST, "Không tìm thấy trường fee trong phản hồi", response.getBody());
            }

            return ApiResponse.success("Lấy phí vận chuyển thành công", feeNode.asInt());
        } catch (Exception e) {
            return ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi xử lý phí vận chuyển", e.getMessage());
        }
    }



    public ApiResponse<String> cancelOrder(String trackingOrder) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Token", ghtkToken);
            headers.set("X-Client-Source", "S308157");

            String url = "https://services.giaohangtietkiem.vn/services/shipment/cancel/" + trackingOrder;

            HttpEntity<String> httpEntity = new HttpEntity<>("{}", headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, httpEntity, String.class);

            String responseBody = response.getBody();
            JsonNode rootNode = objectMapper.readTree(responseBody);

            if (response.getStatusCode().is2xxSuccessful()) {
                boolean success = rootNode.path("success").asBoolean(false);
                if (success) {
                    return ApiResponse.success("Hủy đơn hàng thành công", responseBody);
                } else {
                    return ApiResponse.error(HttpStatus.BAD_REQUEST, "Hủy đơn thất bại", responseBody);
                }
            } else {
                return ApiResponse.error(HttpStatus.valueOf(response.getStatusCodeValue()), "Lỗi khi gọi API hủy đơn", responseBody);
            }

        } catch (HttpStatusCodeException ex) {
            try {
                String errorBody = ex.getResponseBodyAsString();
                return ApiResponse.error(HttpStatus.valueOf(ex.getStatusCode().value()), "Lỗi khi gọi API hủy đơn", errorBody);
            } catch (Exception parseEx) {
                ObjectNode fallback = objectMapper.createObjectNode();
                fallback.put("exception", parseEx.getClass().getSimpleName());
                fallback.put("message", parseEx.getMessage());
                return ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi parse lỗi từ API", fallback.toString());
            }
        } catch (Exception e) {
            ObjectNode errorJson = objectMapper.createObjectNode();
            errorJson.put("exception", e.getClass().getSimpleName());
            errorJson.put("message", e.getMessage());
            return ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống", errorJson.toString());
        }
    }

    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<JsonNode>> getOrderStatus(String label) {
        try {
            String url = "https://services.giaohangtietkiem.vn/services/shipment/v2/" + label;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghtkToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    request,
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            boolean success = root.path("success").asBoolean(false);

            if (success) {
                return ResponseEntityBuilder.success("Lấy trạng thái đơn hàng thành công", root);
            } else {
                return (ResponseEntity<ApiResponse<JsonNode>>)(ResponseEntity<?>) ResponseEntityBuilder.badRequest("Không lấy được trạng thái đơn", root.toString());
            }

        } catch (HttpStatusCodeException ex) {
            try {
                JsonNode errorJson = objectMapper.readTree(ex.getResponseBodyAsString());
                HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
                if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;

                return (ResponseEntity<ApiResponse<JsonNode>>)(ResponseEntity<?>) ResponseEntityBuilder.status(
                        status,
                        "Lỗi từ GHTK",
                        errorJson
                );

            } catch (Exception parseEx) {
                return (ResponseEntity<ApiResponse<JsonNode>>)(ResponseEntity<?>) ResponseEntityBuilder.serverError("Lỗi phân tích lỗi GHTK", parseEx.getMessage());
            }
        } catch (Exception e) {
            return (ResponseEntity<ApiResponse<JsonNode>>)(ResponseEntity<?>) ResponseEntityBuilder.serverError("Lỗi hệ thống", e.getMessage());
        }
    }

    public ResponseEntity<?> getLabel(String trackingOrder, String original, String paperSize) {
        try {
            String url = "https://services.giaohangtietkiem.vn/services/label/" + trackingOrder;

            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url);
            if (original != null && !original.isEmpty()) {
                builder.queryParam("original", original);
            }
            if (paperSize != null && !paperSize.isEmpty()) {
                builder.queryParam("paper_size", paperSize);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghtkToken);

            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(
                    builder.toUriString(),
                    HttpMethod.GET,
                    request,
                    byte[].class
            );

            // Kiểm tra Content-Type xem có phải PDF không
            if (response.getHeaders().getContentType() != null
                    && response.getHeaders().getContentType().includes(MediaType.APPLICATION_PDF)) {
                // Trả về file PDF dưới dạng binary
                HttpHeaders responseHeaders = new HttpHeaders();
                responseHeaders.setContentType(MediaType.APPLICATION_PDF);
                responseHeaders.setContentDisposition(ContentDisposition.builder("attachment").filename(trackingOrder + ".pdf").build());
                responseHeaders.setContentLength(response.getBody().length);
                responseHeaders.set("Content-Transfer-Encoding", "binary");

                return new ResponseEntity<>(response.getBody(), responseHeaders, HttpStatus.OK);
            } else {
                // Trường hợp lỗi: body là JSON dạng text, parse và trả về JSON lỗi
                String jsonString = new String(response.getBody(), StandardCharsets.UTF_8);
                JsonNode errorJson = objectMapper.readTree(jsonString);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorJson);
            }

        } catch (HttpStatusCodeException ex) {
            try {
                String errorBody = ex.getResponseBodyAsString();
                JsonNode errorJson = objectMapper.readTree(errorBody);
                return ResponseEntity.status(ex.getStatusCode()).body(errorJson);
            } catch (Exception parseEx) {
                ObjectNode fallback = objectMapper.createObjectNode();
                fallback.put("exception", parseEx.getClass().getSimpleName());
                fallback.put("message", parseEx.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(fallback);
            }
        } catch (Exception e) {
            ObjectNode error = objectMapper.createObjectNode();
            error.put("exception", e.getClass().getSimpleName());
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }




}


