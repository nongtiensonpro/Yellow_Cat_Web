package org.yellowcat.backend.user.UserDTO;

import org.yellowcat.backend.user.AppUser;

public record AppUserDTO(
        Integer id,
        String email,
        String name,
        String phone,
        String avatar
) {
    public AppUserDTO(AppUser appUser) {
        this(
                appUser.getAppUserId(),
                appUser.getEmail(),
                appUser.getFullName(),
                appUser.getPhoneNumber(),
                appUser.getAvatarUrl()
        );
    }
}
