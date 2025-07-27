package org.yellowcat.backend.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.yellowcat.backend.common.security.keycloak.UserDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, Integer> {

//    Optional<AppUser> findByEmail(String email);
//    Optional<AppUser> findByKeycloakUserId(String keycloakUserId);

    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByPhoneNumber(String phoneNumber);
    Optional<AppUser> findByKeycloakId(UUID keycloakId);

    @Modifying
    @Query("DELETE FROM AppUser u WHERE u.keycloakId = :id")
    int deleteByKeycloakId(@Param("id") UUID id);

    boolean existsByKeycloakId(UUID keycloakId);

    List<AppUser> findAllByPhoneNumber(String phoneNumber);


}
