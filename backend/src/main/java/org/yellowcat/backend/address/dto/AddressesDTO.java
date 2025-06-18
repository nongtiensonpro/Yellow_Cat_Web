package org.yellowcat.backend.address.dto;

import org.yellowcat.backend.address.Addresses;

import java.util.UUID;

public record AddressesDTO(
        Integer addressId,
        Integer appUserId,
        String recipientName,
        String phoneNumber,
        String streetAddress,
        String wardCommune,
        String district,
        String cityProvince,
        String country,
        Boolean isDefault,
        String addressType
) {
    public AddressesDTO(Addresses address) {
        this(
                address.getAddressId(),
                address.getAppUser().getAppUserId(),
                address.getRecipientName(),
                address.getPhoneNumber(),
                address.getStreetAddress(),
                address.getWardCommune(),
                address.getDistrict(),
                address.getCityProvince(),
                address.getCountry(),
                address.getIsDefault(),
                address.getAddressType()
        );
    }
}

