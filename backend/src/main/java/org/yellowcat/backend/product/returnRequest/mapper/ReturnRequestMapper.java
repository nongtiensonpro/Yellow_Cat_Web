package org.yellowcat.backend.product.returnRequest.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.yellowcat.backend.product.returnRequest.ReturnRequest;
import org.yellowcat.backend.product.returnRequest.dto.response.ReturnRequestResponse;

@Mapper(componentModel = "spring")
public interface ReturnRequestMapper {
    @Mapping(target = "username", source = "appUser.username")
    @Mapping(target = "orderCode", source = "order.orderCode")
    ReturnRequestResponse toResponse(ReturnRequest entity);
}
