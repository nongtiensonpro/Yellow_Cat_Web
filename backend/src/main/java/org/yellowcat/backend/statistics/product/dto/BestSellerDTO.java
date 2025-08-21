package org.yellowcat.backend.statistics.product.dto;

import lombok.Data;

@Data
public class BestSellerDTO {
    private Integer productId;
    private String name;
    private String category;
    private String brand;
    private Integer sales;
    private Double revenue;
    private Integer stock;
}