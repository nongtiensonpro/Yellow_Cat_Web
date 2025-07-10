// src/main/java/org/yellowcat/backend/product/promotionproduct/dto/DuplicateVariantsResponse.java
package org.yellowcat.backend.product.promotionproduct.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class DuplicateVariantsResponse {
    private List<String> conflicts;
}
