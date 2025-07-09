package org.yellowcat.backend.zalopay.dto;

import lombok.Data;

@Data
public class ZaloPayItem {
    private String itemid;
    private String itemname;
    private Long itemprice;
    private Integer itemquantity;
}
