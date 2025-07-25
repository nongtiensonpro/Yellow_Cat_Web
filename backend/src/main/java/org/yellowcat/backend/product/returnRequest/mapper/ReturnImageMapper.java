package org.yellowcat.backend.product.returnRequest.mapper;

import org.mapstruct.Mapper;
import org.yellowcat.backend.product.returnRequest.ReturnImage;
import org.yellowcat.backend.product.returnRequest.dto.response.ReturnImageResponse;

@Mapper(componentModel = "spring")
public interface ReturnImageMapper {
    ReturnImageResponse toResponse(ReturnImage returnImage);
}
