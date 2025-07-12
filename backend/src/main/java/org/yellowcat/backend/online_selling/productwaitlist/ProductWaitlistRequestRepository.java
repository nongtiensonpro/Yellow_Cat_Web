package org.yellowcat.backend.online_selling.productwaitlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductWaitlistRequestRepository extends JpaRepository<ProductWaitlistRequest, Integer> {
    List<ProductWaitlistRequest> findAllByStatus(WaitlistStatus status);

    List<ProductWaitlistRequest> findAllByAppUserKeycloakId(UUID appUserKey);

    Optional<ProductWaitlistRequest> findByCode(String code);
}
