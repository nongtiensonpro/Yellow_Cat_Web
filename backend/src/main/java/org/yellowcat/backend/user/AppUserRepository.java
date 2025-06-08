package org.yellowcat.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Integer> {

    boolean existsByEmail(String email);
    boolean existsByKeycloakUserId(String keycloakUserId);
}
