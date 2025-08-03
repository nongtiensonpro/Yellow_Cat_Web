package org.yellowcat.backend.product.promotionproduct.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PromotionConflictCheckRequest {
    private List<Integer> variantIds;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer promotionProductId; // nullable: khi edit thì truyền vào để exclude chính nó

    public List<Integer> getVariantIds() {
        return variantIds;
    }

    public void setVariantIds(List<Integer> variantIds) {
        this.variantIds = variantIds;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public Integer getPromotionProductId() {
        return promotionProductId;
    }

    public void setPromotionProductId(Integer promotionProductId) {
        this.promotionProductId = promotionProductId;
    }
}
