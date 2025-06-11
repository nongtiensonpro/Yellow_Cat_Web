package org.yellowcat.backend.address;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressRepository extends JpaRepository<Addresses,Integer> {
    Page<Addresses> findAllByAppUser_AppUserId(Integer appUserId, Pageable pageable);
}
