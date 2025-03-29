package org.yellowcat.backend.product.brand.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBrandRequest(
    @NotBlank(message = "Tên thương hiệu không được để trống")
    @Size(max = 255, message = "Tên thương hiệu không được vượt quá 255 ký tự")
    String brandName,

    @NotBlank(message = "Logo public ID không được để trống")
    @Size(max = 255, message = "Logo public ID không được vượt quá 255 ký tự")
    String logoPublicId
) {}