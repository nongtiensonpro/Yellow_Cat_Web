package org.yellowcat.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Integer> {
    Optional<AppUser> findByKeycloakUserId(String keycloakUserId);
}
