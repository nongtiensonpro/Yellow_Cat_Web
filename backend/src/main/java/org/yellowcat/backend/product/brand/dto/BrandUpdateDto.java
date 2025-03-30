package org.yellowcat.backend.product.brand.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.yellowcat.backend.product.brand.Brand;

import java.io.Serializable;
import java.util.Objects;

/**
 * DTO for {@link Brand}
 */
public class BrandUpdateDto implements Serializable {
    private final Integer id;
    @NotNull
    @Size(max = 255)
    private final String brandName;
    @NotNull
    @Size(max = 255)
    private final String logoPublicId;
    @NotNull
    private final String brandInfo;

    public BrandUpdateDto(Integer id, String brandName, String logoPublicId, String brandInfo) {
        this.id = id;
        this.brandName = brandName;
        this.logoPublicId = logoPublicId;
        this.brandInfo = brandInfo;
    }

    public Integer getId() {
        return id;
    }

    public String getBrandName() {
        return brandName;
    }

    public String getLogoPublicId() {
        return logoPublicId;
    }

    public String getBrandInfo() {
        return brandInfo;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BrandUpdateDto entity = (BrandUpdateDto) o;
        return Objects.equals(this.id, entity.id) &&
                Objects.equals(this.brandName, entity.brandName) &&
                Objects.equals(this.logoPublicId, entity.logoPublicId) &&
                Objects.equals(this.brandInfo, entity.brandInfo);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, brandName, logoPublicId, brandInfo);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "(" +
                "id = " + id + ", " +
                "brandName = " + brandName + ", " +
                "logoPublicId = " + logoPublicId + ", " +
                "brandInfo = " + brandInfo + ")";
    }
}