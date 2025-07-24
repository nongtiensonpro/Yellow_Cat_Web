package org.yellowcat.backend.product.dto;

import java.util.List;

public class VariantPromosDTO {
    private VariantPromoItemDTO bestPromo;
    private List<VariantPromoItemDTO> usablePromos;

    public VariantPromoItemDTO getBestPromo() {
        return bestPromo;
    }

    public void setBestPromo(VariantPromoItemDTO bestPromo) {
        this.bestPromo = bestPromo;
    }

    public List<VariantPromoItemDTO> getUsablePromos() {
        return usablePromos;
    }

    public void setUsablePromos(List<VariantPromoItemDTO> usablePromos) {
        this.usablePromos = usablePromos;
    }
} 