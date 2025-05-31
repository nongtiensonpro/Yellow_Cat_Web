package org.yellowcat.backend.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.yellowcat.backend.common.security.keycloak.UserDTO;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Integer> {

//    Optional<AppUser> findByEmail(String email);
//    Optional<AppUser> findByKeycloakUserId(String keycloakUserId);
}
