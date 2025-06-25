//package org.yellowcat.backend.product.promotion.dto;
//
//import lombok.AllArgsConstructor;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import lombok.Setter;
//import lombok.experimental.FieldDefaults;
//
//import java.math.BigDecimal;
//import java.time.LocalDateTime;
//
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
//public class PromotionResponse {
//    String promotionCode;
//    String promotionName;
//    String description;
//    String discountType;
//    BigDecimal discountValue;
//    LocalDateTime startDate;
//    LocalDateTime endDate;
//    Boolean isActive;
//    String createBy;
//}


package org.yellowcat.backend.product.promotion.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class PromotionResponse {
    Integer id;
    String promotionCode;
    String promotionName;
    String description;
    String discountType;
    BigDecimal discountValue;
    LocalDateTime startDate;
    LocalDateTime endDate;
    Boolean isActive;
    String createBy;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}