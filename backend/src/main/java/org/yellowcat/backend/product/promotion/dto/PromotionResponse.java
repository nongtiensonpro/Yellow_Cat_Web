package org.yellowcat.backend.product.promotion.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PromotionResponse {
    String name;
    Double discountPercent;
    LocalDateTime startDate;
    LocalDateTime endDate;
    Boolean isActive;
}