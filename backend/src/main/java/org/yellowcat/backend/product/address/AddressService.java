package org.yellowcat.backend.product.address;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserService;
import org.yellowcat.backend.product.address.dto.AddressesDTO;

import java.util.List;

@Service
public class AddressService {
    @Autowired
    private AddressRepository addressRepository;
    @Autowired
    private AppUserService appUserService;


    public Page<AddressesDTO> findAllAddresses(Pageable pageable) {
        Page<Addresses> addresses = addressRepository.findAll(pageable);
        return addresses.map(AddressesDTO::new);
    }


    public Page<AddressesDTO> findAllAddressesByAppUserId(Integer appUID, Pageable pageable) {
        Page<Addresses> addresses = addressRepository.findAllByAppUser_AppUserId(appUID, pageable);
        return addresses.map(AddressesDTO::new); //
    }

    public AddressesDTO create(AddressesDTO addressesDTO, int userAppId) {
       Addresses adressnew =  convertFromDTO(addressesDTO, userAppId);
        addressRepository.save(adressnew);
        return addressesDTO;
    }

    public AddressesDTO update(AddressesDTO addressesDTO,int userAppId) {
        Addresses addresses = convertFromDTO(addressesDTO, userAppId);
        addressRepository.save(addresses);
        return addressesDTO;
    }


    public Addresses convertFromDTO(AddressesDTO addressesDTO, int userAppId) {
        Addresses addresses = new Addresses();
        addresses.setAddressId(addressesDTO.addressId());
        AppUser uai = appUserService.findById(userAppId).orElseThrow(() -> new RuntimeException("User not found"));
        addresses.setAppUser(uai);
        // Gán các trường khác từ DTO sang entity
        addresses.setRecipientName(addressesDTO.recipientName());
        addresses.setPhoneNumber(addressesDTO.phoneNumber());
        addresses.setStreetAddress(addressesDTO.streetAddress());
        addresses.setWardCommune(addressesDTO.wardCommune());
        addresses.setDistrict(addressesDTO.district());
        addresses.setCityProvince(addressesDTO.cityProvince());
        addresses.setCountry(addressesDTO.country());
        addresses.setIsDefault(addressesDTO.isDefault());
        addresses.setAddressType(addressesDTO.addressType());
        return addresses;
    }

    public boolean deleteAll(List<Integer> ids) {
        List<Addresses> addresses = addressRepository.findAllById(ids);
        if (addresses.size() != ids.size()) {
            return false;
        }
        addressRepository.deleteAll(addresses);
        return true;
    }

}
