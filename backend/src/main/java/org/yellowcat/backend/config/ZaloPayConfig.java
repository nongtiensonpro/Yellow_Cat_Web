package org.yellowcat.backend.config;


import org.springframework.context.annotation.Configuration;

@Configuration
public class ZaloPayConfig {
    public static final String APP_ID = "2554";  // Đặt ID ứng dụng của bạn
    public static final String KEY1 = "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn";  // Khóa 1
    public static final String KEY2 = "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf";  // Khóa 2
    public static final String ENDPOINT = "https://sb-openapi.zalopay.vn/v2/create";  // API endpoint ZaloPay
}
