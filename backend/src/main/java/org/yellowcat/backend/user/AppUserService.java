//package org.yellowcat.backend.user;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.Pageable;
//import org.springframework.stereotype.Service;
//import org.yellowcat.backend.common.security.keycloak.UserDTO;
//import org.yellowcat.backend.user.UserDTO.AppUserDTO;
//
//
//import java.time.Instant;
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.Optional;
//
//@Service
//public class AppUserService {
//
//    @Autowired
//    private AppUserRepository appUserRepository;
//
//    public Page<AppUserDTO> findAll(Pageable pageable) {
//        Page<AppUser> appUsers = appUserRepository.findAll(pageable);
//        return appUsers.map(AppUserDTO::new);
//    }
//
//    public Optional<AppUser> findById(Integer id) {
//        return appUserRepository.findById(id);
//    }
//
//    public AppUserDTO create(AppUserDTO user, String keycloakUserId) {
//        AppUser userSave = convertFromDTO(user,keycloakUserId);
//        appUserRepository.save(userSave);
//        return user;
//    }
//
//    public AppUserDTO update(AppUserDTO user, String keycloakUserId) {
//        AppUser userSave = convertFromDTO(user,keycloakUserId);
//        appUserRepository.save(userSave);
//        return user;
//    }
//
//    public Boolean delete(Integer id) {
//        if (appUserRepository.existsById(id)) {
//            appUserRepository.deleteById(id);
//            return true;  // Xóa thành công
//        }
//        return false;
//    }
//
//
//    public AppUser convertFromDTO(AppUserDTO appUserDTO, String keycloakUserId) {
//        AppUser appUser = new AppUser();
//        appUser.setAppUserId(appUserDTO.id());
//        appUser.setKeycloakUserId(keycloakUserId);
//        appUser.setEmail(appUserDTO.email());
//        appUser.setFullName(appUserDTO.name());
//        appUser.setPhoneNumber(appUserDTO.phone());
//        appUser.setAvatarUrl(appUserDTO.avatar());
//        return appUser;
//    }
//}

package org.yellowcat.backend.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.user.UserDTO.AppUserDTO;

import java.time.Instant;
import java.util.Optional;

@Service
public class AppUserService {

    @Autowired
    private AppUserRepository appUserRepository;

    public Page<AppUserDTO> findAll(Pageable pageable) {
        return appUserRepository.findAll(pageable).map(AppUserDTO::new);
    }

    public Optional<AppUser> findById(Integer id) {
        return appUserRepository.findById(id);
    }

    public AppUserDTO createUser(AppUserDTO user, String keycloakUserId) {
        AppUser userToSave = convertFromDTO(user, keycloakUserId);
        userToSave.setCreatedAt(Instant.now());
        userToSave.setUpdatedAt(Instant.now());
        appUserRepository.save(userToSave);
        return new AppUserDTO(userToSave);
    }

    public AppUserDTO updateUser(AppUserDTO user, String keycloakUserId) {
        AppUser userToSave = convertFromDTO(user, keycloakUserId);
        userToSave.setUpdatedAt(Instant.now());
        appUserRepository.save(userToSave);
        return new AppUserDTO(userToSave);
    }

    public Boolean delete(Integer id) {
        if (appUserRepository.existsById(id)) {
            appUserRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private AppUser convertFromDTO(AppUserDTO dto, String keycloakUserId) {
        AppUser user = new AppUser();
        user.setAppUserId(dto.id());
        user.setKeycloakUserId(keycloakUserId);
        user.setEmail(dto.email());
        user.setFullName(dto.name());
        user.setPhoneNumber(dto.phone());
        user.setAvatarUrl(dto.avatar());
        return user;
    }
}

