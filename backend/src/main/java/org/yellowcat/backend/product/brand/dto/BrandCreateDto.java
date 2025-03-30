package org.yellowcat.backend.product.brand.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.yellowcat.backend.product.brand.Brand;

import java.io.Serializable;

/**
 * DTO for {@link Brand}
 */
public record BrandCreateDto(@NotNull @Size(max = 255) String brandName, @NotNull @Size(max = 255) String logoPublicId,
                             @NotNull String brandInfo) implements Serializable {
    public BrandCreateDto(String brandName, String logoPublicId, String brandInfo) {
        this.brandName = brandName;
        this.logoPublicId = logoPublicId;
        this.brandInfo = brandInfo;
    }

    @Override
    public String brandName() {
        return brandName;
    }

    @Override
    public String logoPublicId() {
        return logoPublicId;
    }

    @Override
    public String brandInfo() {
        return brandInfo;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "(" +
                "brandName = " + brandName + ", " +
                "logoPublicId = " + logoPublicId + ", " +
                "brandInfo = " + brandInfo + ")";
    }
}