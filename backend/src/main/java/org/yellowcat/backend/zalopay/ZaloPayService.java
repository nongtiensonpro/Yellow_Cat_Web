package org.yellowcat.backend.zalopay;

import jakarta.transaction.Transactional;
import org.apache.commons.codec.binary.Hex;
import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.message.BasicNameValuePair;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.online_selling.PaymentStatus;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.order.OrderRepository;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.payment.Payment;
import org.yellowcat.backend.product.payment.PaymentRepository;
import org.yellowcat.backend.online_selling.oder_online.OderOnlineRepository;
import org.yellowcat.backend.zalopay.dto.ZaloPayItem;
import org.yellowcat.backend.zalopay.dto.ZaloPayRequestDTO;
import vn.zalopay.crypto.HMACUtil;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class ZaloPayService {

    private static final String APP_ID = "2554";
    private static final String KEY1 = "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn";
    private static final String KEY2 = "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf";
    private static final String CREATE_ENDPOINT = "https://sb-openapi.zalopay.vn/v2/create";
    private static final String QUERY_ENDPOINT = "https://sb-openapi.zalopay.vn/v2/query";
    private static final String REFUND_ENDPOINT = "https://sb-openapi.zalopay.vn/v2/refund";
    private static final String CHECK_REFUND_ENDPOINT = "https://sb-openapi.zalopay.vn/v2/query_refund";

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OderOnlineRepository oderOnlineRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final Mac hmacSHA256;

    public ZaloPayService() throws Exception {
        hmacSHA256 = Mac.getInstance("HmacSHA256");
        hmacSHA256.init(new SecretKeySpec(KEY2.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    }

    private String generateAppTransId() {
        String date = new SimpleDateFormat("yyMMdd").format(new Date());
        int random = new Random().nextInt(1000000);
        return date + "_" + random;
    }

    private String getCurrentTimeString(String format) {
        Calendar cal = new GregorianCalendar(TimeZone.getTimeZone("GMT+7"));
        SimpleDateFormat fmt = new SimpleDateFormat(format);
        fmt.setCalendar(cal);
        return fmt.format(cal.getTimeInMillis());
    }

    @Transactional
    public Map<String, Object> createZaloPayOrder(String orderCode) throws Exception {
        // Lấy order từ DB - sử dụng oderOnlineRepository để tìm cả đơn hàng online và tại quầy
        Order order = oderOnlineRepository.findByOrderCode(orderCode);
        if (order == null) {
            throw new IllegalArgumentException("Không tìm thấy đơn hàng với mã: " + orderCode);
        }

        // Null-safe lấy userId
        String userId = (order.getUser() != null && order.getUser().getEmail() != null)
                ? order.getUser().getEmail().toString()
                : "guest";

        // Sinh app_trans_id
        String appTransId = generateAppTransId(); // ví dụ: 240708_xxxxxx
        long amount = order.getFinalAmount().longValue();
        long timestamp = System.currentTimeMillis();

        // Danh sách item JSON từ OrderItem
        JSONArray items = new JSONArray();
        for (OrderItem item : order.getOrderItems()) {
            JSONObject obj = new JSONObject();
            obj.put("itemid", item.getOrderItemId().toString());
            obj.put("itemname", item.getVariant().getProduct().getProductName());
            obj.put("itemprice", item.getPriceAtPurchase().longValue());
            obj.put("itemquantity", item.getQuantity());
            items.put(obj);
        }

        // Embed data: truyền mã đơn hàng để xác định trong callback
        JSONObject embedData = new JSONObject();
        embedData.put("order_id", order.getOrderCode());

        // Build body
        JSONObject zaloRequest = new JSONObject();
        zaloRequest.put("app_id", APP_ID);
        zaloRequest.put("app_user", userId);
        zaloRequest.put("app_trans_id", appTransId);
        zaloRequest.put("app_time", timestamp);
        zaloRequest.put("amount", amount);
        zaloRequest.put("item", items.toString());
        zaloRequest.put("description", "Thanh toán đơn hàng " + orderCode);
        zaloRequest.put("bank_code", "");
        zaloRequest.put("embed_data", embedData.toString());
        zaloRequest.put("callback_url", "https://1d806f2a64ca.ngrok-free.app/api/payment/callback");

        // Tính MAC
        String data = APP_ID + "|" + appTransId + "|" + userId + "|" + amount + "|" + timestamp + "|" +
                embedData + "|" + items.toString();
        String mac = HMACUtil.HMacHexStringEncode(HMACUtil.HMACSHA256, KEY1, data);
        zaloRequest.put("mac", mac);

        // Gửi request HTTP
        HttpPost post = new HttpPost(CREATE_ENDPOINT);
        List<NameValuePair> params = new ArrayList<>();
        for (String key : zaloRequest.keySet()) {
            params.add(new BasicNameValuePair(key, zaloRequest.get(key).toString()));
        }

        post.setEntity(new UrlEncodedFormEntity(params, StandardCharsets.UTF_8));
        CloseableHttpClient client = HttpClients.createDefault();
        CloseableHttpResponse response = client.execute(post);

        BufferedReader rd = new BufferedReader(new InputStreamReader(response.getEntity().getContent()));
        StringBuilder result = new StringBuilder();
        String line;
        while ((line = rd.readLine()) != null) {
            result.append(line);
        }

        JSONObject responseJson = new JSONObject(result.toString());
        Map<String, Object> resultMap = new HashMap<>();
        for (String key : responseJson.keySet()) {
            resultMap.put(key, responseJson.get(key));
        }

        // Lưu Payment vào DB
        Payment payment = paymentRepository.findByOrder(order);
        if (payment == null) {
            payment = new Payment();
            payment.setOrder(order);
        }
        payment.setTransactionId(appTransId);
        payment.setPaymentStatus("PENDING");
        payment.setAmount(BigDecimal.valueOf(amount));
        payment.setOrder(order);
        paymentRepository.save(payment);

        return resultMap;
    }


    @Transactional
    public JSONObject getOrderStatus(String appTransId) throws Exception {
        String data = APP_ID + "|" + appTransId + "|" + KEY1;
        String mac = HMACUtil.HMacHexStringEncode(HMACUtil.HMACSHA256, KEY1, data);

        List<NameValuePair> params = new ArrayList<>();
        params.add(new BasicNameValuePair("app_id", APP_ID));
        params.add(new BasicNameValuePair("app_trans_id", appTransId));
        params.add(new BasicNameValuePair("mac", mac));

        URIBuilder uri = new URIBuilder(QUERY_ENDPOINT);
        uri.addParameters(params);

        CloseableHttpClient client = HttpClients.createDefault();
        HttpPost post = new HttpPost(uri.build());
        post.setEntity(new UrlEncodedFormEntity(params));

        BufferedReader rd = new BufferedReader(new InputStreamReader(client.execute(post).getEntity().getContent()));
        StringBuilder resultJsonStr = new StringBuilder();
        String line;
        while ((line = rd.readLine()) != null) {
            resultJsonStr.append(line);
        }

        return new JSONObject(resultJsonStr.toString());
    }

    @Transactional
    public Map<String, Object> processCallback(Map<String, Object> callbackBody) {
        Map<String, Object> result = new HashMap<>();
        try {
            String data = (String) callbackBody.get("data");
            String reqMac = (String) callbackBody.get("mac");
            String calculatedMac = HMACUtil.HMacHexStringEncode(HMACUtil.HMACSHA256, KEY2, data);

            if (!calculatedMac.equals(reqMac)) {
                result.put("return_code", -1);
                result.put("return_message", "Mac not match");
                return result;
            }

            JSONObject dataJson = new JSONObject(data);
            String appTransId = dataJson.getString("app_trans_id");
            String zpTransId = String.valueOf(dataJson.getLong("zp_trans_id"));

            Payment payment = paymentRepository.findByTransactionId(appTransId);
            if (payment == null) {
                result.put("return_code", 2);
                result.put("return_message", "Không tìm thấy giao dịch");
                return result;
            }

            if (!"SUCCESS".equals(payment.getPaymentStatus())) {
                payment.setPaymentStatus("SUCCESS");
                payment.setZpTransId(zpTransId);
                paymentRepository.save(payment);

                // ✅ Gửi thông báo realtime qua WebSocket
                messagingTemplate.convertAndSend(
                        "/topic/payment-status/" + payment.getOrder().getOrderCode(),
                        Map.of(
                                "status", "PAID",
                                "orderCode", payment.getOrder().getOrderCode(),
                                "amount", payment.getAmount(),
                                "message", "Thanh toán thành công đơn hàng #" + payment.getOrder().getOrderCode()
                        )
                );

                System.out.println("Thông báo chạy qua hàm thanh toán thành công ");
                Order order = payment.getOrder();
                if (order != null && !"PAID".equals(order.getPaymentStatus())) {
                    order.setPaymentStatus(PaymentStatus.PAID);
                    payment.setOrder(order);
                    paymentRepository.save(payment);
                }
            } else {
                result.put("return_code", 2);
                result.put("return_message", "Giao dịch đã xử lý trước đó");
                return result;
            }

            result.put("return_code", 1);
            result.put("return_message", "Success");
            return result;
        } catch (Exception e) {
            result.put("return_code", 0);
            result.put("return_message", "Lỗi xử lý: " + e.getMessage());
            e.printStackTrace();
            return result;
        }
    }

    public Map<String, Object> refundTransaction(String zpTransId, long amount, String description) throws Exception {
        long timestamp = System.currentTimeMillis();
        String mRefundId = generateRefundId();

        System.out.println("Mã giao dịch cần hoàn tiền là:"+ zpTransId);
        String hmacInput = APP_ID + "|" + zpTransId + "|" + amount + "|" + description + "|" + timestamp;
        String mac = HMACUtil.HMacHexStringEncode(HMACUtil.HMACSHA256, KEY1, hmacInput);

        List<NameValuePair> params = new ArrayList<>();
        params.add(new BasicNameValuePair("m_refund_id", mRefundId));
        params.add(new BasicNameValuePair("app_id", APP_ID));
        params.add(new BasicNameValuePair("zp_trans_id", zpTransId));
        params.add(new BasicNameValuePair("amount", String.valueOf(amount)));
        params.add(new BasicNameValuePair("timestamp", String.valueOf(timestamp)));
        params.add(new BasicNameValuePair("description", description));
        params.add(new BasicNameValuePair("mac", mac));

        Payment payment = paymentRepository.findByZpTransId(zpTransId);
        payment.setMRefundId(mRefundId);
        payment.setPaymentStatus("REFUNDED");
        payment.setRefundAmount(amount);
        paymentRepository.save(payment);

        System.out.println("Gửi hoàn tiền với m_refund_id: " + mRefundId);
        System.out.println("Số tền được hoàn là : " + amount);

        CloseableHttpClient client = HttpClients.createDefault();
        HttpPost post = new HttpPost(REFUND_ENDPOINT);
        post.setEntity(new UrlEncodedFormEntity(params));

        CloseableHttpResponse response = client.execute(post);
        BufferedReader reader = new BufferedReader(new InputStreamReader(response.getEntity().getContent()));

        StringBuilder result = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            result.append(line);
        }

        JSONObject resultJson = new JSONObject(result.toString());
        Map<String, Object> resultMap = new HashMap<>();
        for (String key : resultJson.keySet()) {
            resultMap.put(key, resultJson.get(key));
        }
        return resultMap;
    }

    public Map<String, Object> queryRefundStatus(String codeOrder) throws Exception {
        Payment payment = paymentRepository.findByOrder_OrderCode(codeOrder);
        String mRefundId = payment.getMRefundId();

        long timestamp = System.currentTimeMillis();
        String hmacInput = APP_ID + "|" + mRefundId + "|" + timestamp;
        String mac = HMACUtil.HMacHexStringEncode(HMACUtil.HMACSHA256, KEY1, hmacInput);

        List<NameValuePair> params = new ArrayList<>();
        params.add(new BasicNameValuePair("app_id", APP_ID));
        params.add(new BasicNameValuePair("m_refund_id", mRefundId));
        params.add(new BasicNameValuePair("timestamp", String.valueOf(timestamp)));
        params.add(new BasicNameValuePair("mac", mac));

        System.out.println("app_id: " + APP_ID);
        System.out.println("m_refund_id: " + mRefundId);
        System.out.println("timestamp: " + timestamp);
        System.out.println("mac: " + mac);


        CloseableHttpClient client = HttpClients.createDefault();
        HttpPost post = new HttpPost(CHECK_REFUND_ENDPOINT);
        post.setEntity(new UrlEncodedFormEntity(params));

        CloseableHttpResponse response = client.execute(post);
        BufferedReader reader = new BufferedReader(new InputStreamReader(response.getEntity().getContent()));

        StringBuilder result = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            result.append(line);
        }

        JSONObject json = new JSONObject(result.toString());
        Map<String, Object> resultMap = new HashMap<>();
        for (String key : json.keySet()) {
            resultMap.put(key, json.get(key));
        }

        return resultMap;
    }

    private String generateRefundId() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyMMdd");
        String datePart = sdf.format(new Date());
        String randomPart = String.format("%06d", new Random().nextInt(1000000));
        return datePart + "_" + APP_ID + "_" + randomPart;
    }
}