package org.yellowcat.backend.product.address;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AddressRepository extends JpaRepository<Addresses,Integer> {
    Page<Addresses> findAllByAppUser_AppUserId(Integer appUserId, Pageable pageable);
}
