package org.yellowcat.backend.statistics.product.dto;

import lombok.Data;

@Data
public class LowStockDTO {
    private String sku;
    private String name;
    private String category;
    private String brand;
    private String color;
    private String size;
    private int stock;
    private int threshold;
    private String status;
}