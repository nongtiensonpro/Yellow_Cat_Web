package org.yellowcat.backend.address;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AddressRepository extends JpaRepository<Addresses,Integer> {

    Page<Addresses> findAllByAppUserKeycloakId(UUID appUserKeycloakId, Pageable pageable);
    
    List<Addresses> findAllByAppUserKeycloakId(UUID appUserKeycloakId);

    Addresses findByAddressId(Integer addressId);
}
