package org.yellowcat.backend.user;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.user.UserDTO.fromFE.UserRequestDTO;


import java.util.Optional;
import java.util.UUID;

@Service
public class AppUserService {

    @Autowired
    private AppUserRepository appUserRepository;

//    public Page<AppUserDTO> findAll(Pageable pageable) {
//        Page<AppUser> appUsers = appUserRepository.findAll(pageable);
//        return appUsers.map(AppUserDTO::new);
//    }

    public Optional<AppUser> findById(Integer id) {
        return appUserRepository.findById(id);
    }

    public Optional<AppUser> findByKeycloakId(UUID keycloakId) {
        return appUserRepository.findByKeycloakId(keycloakId);
    }

    public UserRequestDTO create(UserRequestDTO user) {
        AppUser userSave = convertFromDTO(user);
        appUserRepository.save(userSave);
        return user;
    }

    public UserRequestDTO update(UserRequestDTO user) {
        AppUser userSave = convertFromDTO(user);
        appUserRepository.save(userSave);
        return user;
    }

    @Transactional
    public Boolean delete(UUID id) {
        if (appUserRepository.existsByKeycloakId(id)) {
            int deletedCount = appUserRepository.deleteByKeycloakId(id);
            return deletedCount > 0;
        }
        return false;
    }



    public AppUser convertFromDTO(UserRequestDTO appUserDTO) {
        AppUser appUser = new AppUser();
        appUser.setKeycloakId(appUserDTO.getId());
        appUser.setEmail(appUserDTO.getEmail());
        appUser.setFullName(appUserDTO.getName());
        return appUser;
    }

    public void findOrCreateAppUser(UserRequestDTO dto) {
        Optional<AppUser> existingUser = appUserRepository.findByEmail(dto.getEmail());

        if (existingUser.isPresent()) {
            AppUser user = existingUser.get();
            user.setKeycloakId(dto.getId());
            user.setFullName(dto.getName());
            user.setRoles(dto.getRoles());
            appUserRepository.save(user);
            return;
        }

        // Tạo user mới
        AppUser newUser = new AppUser();
        newUser.setKeycloakId(dto.getId());
        newUser.setEmail(dto.getEmail());
        newUser.setFullName(dto.getName());
        newUser.setRoles(dto.getRoles());
        newUser.setEnabled(true);

        appUserRepository.save(newUser);
    }

}
