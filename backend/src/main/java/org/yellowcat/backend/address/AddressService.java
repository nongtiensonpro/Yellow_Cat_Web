package org.yellowcat.backend.address;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserService;
import org.yellowcat.backend.address.dto.AddressesDTO;

import java.util.List;
import java.util.UUID;

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


    public Page<AddressesDTO> findAllByAppUserKeycloakId(UUID keycloakId, Pageable pageable) {
        Page<Addresses> addresses = addressRepository.findAllByAppUserKeycloakId(keycloakId, pageable);
        return addresses.map(AddressesDTO::new);
    }

    public AddressesDTO create(AddressesDTO addressesDTO, UUID keycloakId) {
        Addresses adressnew =  convertFromDTO(addressesDTO, keycloakId);
        addressRepository.save(adressnew);
        return addressesDTO;
    }

    public AddressesDTO update(AddressesDTO addressesDTO,UUID keycloakId) {
        Addresses addresses = convertFromDTO(addressesDTO, keycloakId);
        addressRepository.save(addresses);
        return addressesDTO;
    }


    public Addresses convertFromDTO(AddressesDTO addressesDTO, UUID  keycloakId) {
        Addresses addresses = new Addresses();
        addresses.setAddressId(addressesDTO.addressId());
        AppUser uai = appUserService.findByKeycloakId(keycloakId).orElseThrow(() -> new RuntimeException("User not found"));
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
            return false; // Một số ID không tồn tại
        }
        addressRepository.deleteAll(addresses);
        return true;
    }

}
