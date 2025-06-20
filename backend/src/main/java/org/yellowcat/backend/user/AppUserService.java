package org.yellowcat.backend.user;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.user.UserDTO.fromFE.UserRequestDTO;
import org.yellowcat.backend.user.UserDTO.fromFE.UserUpdateDTO;


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
//            user.setFullName(dto.getName()); không cập nhật tên người dùng sau khi đã lưu trữ thành công, để người dùng tự cập nhật
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

    public AppUser updateUserProfile(Integer appUserId, UserUpdateDTO dto) {
        Optional<AppUser> existingUser = appUserRepository.findById(appUserId);
        
        if (existingUser.isEmpty()) {
            throw new RuntimeException("Người dùng không tồn tại với ID: " + appUserId);
        }

        AppUser user = existingUser.get();
        
        // Cập nhật các trường được phép
        if (dto.getKeycloakId() != null) {
            user.setKeycloakId(dto.getKeycloakId());
        }
        if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
            user.setEmail(dto.getEmail());
        }
        if (dto.getRoles() != null) {
            user.setRoles(dto.getRoles());
        }
        if (dto.getEnabled() != null) {
            user.setEnabled(dto.getEnabled());
        }
        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            user.setFullName(dto.getFullName());
        }
        if (dto.getPhoneNumber() != null && !dto.getPhoneNumber().trim().isEmpty()) {
            user.setPhoneNumber(dto.getPhoneNumber());
        }
        if (dto.getAvatarUrl() != null) {
            user.setAvatarUrl(dto.getAvatarUrl());
        }

        return appUserRepository.save(user);
    }

    public Optional<AppUser> findByEmail(String email) {
        return appUserRepository.findByEmail(email);
    }


}
