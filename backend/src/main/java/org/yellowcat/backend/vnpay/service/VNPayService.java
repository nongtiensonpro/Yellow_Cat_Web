package org.yellowcat.backend.vnpay.service;

import org.springframework.stereotype.Service;
import org.yellowcat.backend.vnpay.config.VNPayConfig;
import org.yellowcat.backend.vnpay.dto.VNPayCreatePaymentRequest;
import org.yellowcat.backend.vnpay.dto.VNPayResponse;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class VNPayService {
    private final VNPayConfig vnPayConfig;

    public VNPayService(VNPayConfig vnPayConfig) {
        this.vnPayConfig = vnPayConfig;
    }

    public VNPayResponse createPayment(VNPayCreatePaymentRequest request) throws UnsupportedEncodingException {
        if (vnPayConfig.getHashSecret() == null || vnPayConfig.getHashSecret().isEmpty()) {
            throw new IllegalStateException("VNPay configuration error: Hash secret is not configured");
        }
        if (vnPayConfig.getPayUrl() == null || vnPayConfig.getPayUrl().isEmpty()) {
            throw new IllegalStateException("VNPay configuration error: Payment URL is not configured");
        }
        if (vnPayConfig.getTmnCode() == null || vnPayConfig.getTmnCode().isEmpty()) {
            throw new IllegalStateException("VNPay configuration error: Terminal Code is not configured");
        }

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnPayConfig.getVersion());
        vnp_Params.put("vnp_Command", vnPayConfig.getCommand());
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(request.getAmount() * 100));
        vnp_Params.put("vnp_CurrCode", "VND");

        String vnp_TxnRef = getRandomNumber(8);
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);

        vnp_Params.put("vnp_OrderInfo", request.getOrderInfo() != null ? request.getOrderInfo() : "Thanh toan don hang:" + vnp_TxnRef);
        vnp_Params.put("vnp_OrderType", request.getOrderType());
        vnp_Params.put("vnp_Locale", request.getLanguage() != null ? request.getLanguage() : "vn");
        vnp_Params.put("vnp_ReturnUrl", request.getReturnUrl());
        vnp_Params.put("vnp_IpAddr", "127.0.0.1");

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);


        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                // Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());

        if (vnp_SecureHash.isEmpty()) {
            throw new IllegalStateException("Failed to generate secure hash");
        }

        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnPayConfig.getPayUrl() + "?" + queryUrl;

        return new VNPayResponse("00", "success", paymentUrl);
    }

    public VNPayResponse processPaymentReturn(Map<String, String> queryParams) {
        String vnp_SecureHash = queryParams.get("vnp_SecureHash");

        if (vnp_SecureHash != null) {
            Map<String, String> vnp_Params = new HashMap<>(queryParams);
            vnp_Params.remove("vnp_SecureHash");
            vnp_Params.remove("vnp_SecureHashType");

            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                }
            }

            return new VNPayResponse("97","Invalid signature");
        }
        return new VNPayResponse("97","Invalid request");
    }

    private String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                System.err.println("Lỗi: key hoặc data là null trong hmacSHA512");
                return "";
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes();
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            System.err.println("Lỗi khi tạo HMAC: " + ex.getMessage());
            return "";
        }
    }

    private String getRandomNumber(int len) {
        Random rnd = new Random();
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}