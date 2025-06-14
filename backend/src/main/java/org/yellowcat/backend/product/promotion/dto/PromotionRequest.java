//package org.yellowcat.backend.product.promotion.dto;
//
//import jakarta.validation.constraints.NotNull;
//import lombok.*;
//import lombok.experimental.FieldDefaults;
//
//import java.time.LocalDateTime;
//
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@FieldDefaults(level = AccessLevel.PRIVATE)
//public class PromotionRequest {
//    Integer id;
//
//    @NotNull
//    String name;
//
//    @NotNull
//    Double discountPercent;
//
//    LocalDateTime startDate;
//
//    LocalDateTime endDate;
//
//    Boolean isActive;
//}

package org.yellowcat.backend.product.promotion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PromotionRequest {
    Integer id;

    @NotNull
    String promoCode;

    @NotNull
    String name;

    String description;

    @NotNull
    String discountType;

    @NotNull
    Double discountValue;

    LocalDateTime startDate;

    LocalDateTime endDate;

    Double minimumOrderValue;

    Integer usageLimitPerUser;

    Integer usageLimitTotal;

    Boolean isActive;

    String applicableTo;
}

