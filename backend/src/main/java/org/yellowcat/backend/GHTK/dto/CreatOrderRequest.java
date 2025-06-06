package org.yellowcat.backend.GHTK.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatOrderRequest {

    private List<Product> products;

    private Order order;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Product {
        private String name;
        private double weight;  // cân nặng kg, ví dụ 0.1
        private int quantity;
        private int product_code;  // có trong mẫu gửi
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Order {
        private String id;
        private String pick_name;
        private String pick_address;
        private String pick_province;
        private String pick_district;
        private String pick_ward;
        private String pick_tel;
        private String tel;
        private String name;
        private String address;
        private String province;
        private String district;
        private String ward;
        private String hamlet = "Khác";
        private String is_freeship;
        private String pick_date;
        private int pick_money;
        private String note;
        private int value;
        private String transport;
        private String pick_option;
        private String deliver_option;
    }
}
