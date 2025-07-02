package org.yellowcat.backend.zalopay;

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
import org.springframework.stereotype.Service;
import org.yellowcat.backend.online_selling.oder_online.OrderOnlineService;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.payment.Payment;
import org.yellowcat.backend.product.payment.PaymentRepository;
import vn.zalopay.crypto.HMACUtil;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class ZaloPayService {
    private final Mac HmacSHA256;
    private final String KEY2 = "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf"; // Key2 của bạn
    PaymentRepository PaymentRepository;
    @Autowired
    OrderOnlineService orderOnlineService;

    private static final Map<String, String> config = new HashMap<String, String>() {{
        put("app_id", "2554");
        put("key1", "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn");
        put("key2", "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf");
        put("endpoint", "https://sb-openapi.zalopay.vn/v2/create");
        put("endpoint2", "https://sb-openapi.zalopay.vn/v2/query");
    }};
    @Autowired
    private PaymentRepository paymentRepository;

    public ZaloPayService() throws Exception {
        HmacSHA256 = Mac.getInstance("HmacSHA256");
        HmacSHA256.init(new SecretKeySpec(KEY2.getBytes(), "HmacSHA256"));
    }

    private String getCurrentTimeString(String format) {
        Calendar cal = new GregorianCalendar(TimeZone.getTimeZone("GMT+7"));
        SimpleDateFormat fmt = new SimpleDateFormat(format);
        fmt.setCalendar(cal);
        return fmt.format(cal.getTimeInMillis());
    }

    public Map<String, Object> createOrder(Map<String, Object> request) throws Exception {
        Random rand = new Random();
        int random_id = rand.nextInt(1000000);

        // Chuyển đổi danh sách items
        List<Map<String, Object>> itemList = (List<Map<String, Object>>) request.get("items");

        // Chuyển itemList thành JSONArray
        JSONArray itemJSONArray = new JSONArray();
        for (Map<String, Object> itemMap : itemList) {
            itemJSONArray.put(new JSONObject(itemMap));
        }

        JSONObject embedData = new JSONObject(); // rỗng, có thể thêm dữ liệu nếu cần

        String orderId = (String) request.get("orderId");
        String appTransId = getCurrentTimeString("yyMMdd") + "_" + orderId + "_" + System.currentTimeMillis();
        String description = "YellowCatShop - Thanh toan don hang #" + orderId;

        Map<String, Object> order = new HashMap<>();
        order.put("app_id", config.get("app_id"));
        order.put("app_trans_id", appTransId);
        order.put("app_time", System.currentTimeMillis());
        order.put("app_user", request.get("userId"));
        order.put("amount", request.get("totalAmount"));
        order.put("description", description);
        order.put("bank_code", "");
        order.put("item", itemJSONArray.toString());
        order.put("embed_data", embedData.toString());
        order.put("callback_url", "https://75b1-118-70-118-224.ngrok-free.app/api/payment/callback");

        // Tạo chữ ký
        String data = order.get("app_id") + "|" + order.get("app_trans_id") + "|" + order.get("app_user") + "|"
                + order.get("amount") + "|" + order.get("app_time") + "|" + order.get("embed_data") + "|" + order.get("item");

        order.put("mac", HMACUtil.HMacHexStringEncode(HMACUtil.HMACSHA256, config.get("key1"), data));

        System.out.println("Payload sent to ZaloPay: " + order);

        // gắn transaction_id vào payment
        Order orderFromDB = orderOnlineService.getOrderByOrderCode(orderId);
        Payment payment = paymentRepository.findByOrder(orderFromDB);
        payment.setTransactionId(appTransId);
        paymentRepository.save(payment);

        // Gửi request tới ZaloPay
        CloseableHttpClient client = HttpClients.createDefault();
        HttpPost post = new HttpPost(config.get("endpoint"));

        List<NameValuePair> params = new ArrayList<>();
        for (Map.Entry<String, Object> e : order.entrySet()) {
            params.add(new BasicNameValuePair(e.getKey(), e.getValue().toString()));
        }

        post.setEntity(new UrlEncodedFormEntity(params));

        CloseableHttpResponse res = client.execute(post);
        BufferedReader rd = new BufferedReader(new InputStreamReader(res.getEntity().getContent()));
        StringBuilder resultJsonStr = new StringBuilder();
        String line;
        while ((line = rd.readLine()) != null) {
            resultJsonStr.append(line);
        }

        JSONObject result = new JSONObject(resultJsonStr.toString());

        // Chuyển JSONObject thành Map<String, Object>
        Map<String, Object> response = new HashMap<>();
        for (String key : result.keySet()) {
            response.put(key, result.get(key));
        }

        return response;
    }

    public JSONObject getOrderStatus(String appTransId) throws Exception {
        String data = config.get("app_id") + "|" + appTransId + "|" + config.get("key1");
        String mac = HMACUtil.HMacHexStringEncode(HMACUtil.HMACSHA256, config.get("key1"), data);

        List<NameValuePair> params = new ArrayList<>();
        params.add(new BasicNameValuePair("app_id", config.get("app_id")));
        params.add(new BasicNameValuePair("app_trans_id", appTransId));
        params.add(new BasicNameValuePair("mac", mac));

        URIBuilder uri = new URIBuilder(config.get("endpoint2"));
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

    private String generateHMAC(String data) throws Exception {
        Mac hmacSHA256 = Mac.getInstance("HmacSHA256");
        hmacSHA256.init(new SecretKeySpec(KEY2.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hashBytes = hmacSHA256.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Hex.encodeHexString(hashBytes).toLowerCase();
    }
}
