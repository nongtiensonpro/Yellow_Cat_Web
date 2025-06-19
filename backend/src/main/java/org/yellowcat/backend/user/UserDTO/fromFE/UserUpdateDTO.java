package org.yellowcat.backend.user.UserDTO.fromFE;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.yellowcat.backend.user.AppUser;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDTO {
    private Integer appUserId;
    private UUID keycloakId;
    private String email;
    private List<String> roles;
    private Boolean enabled;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;

    public UserUpdateDTO(AppUser user) {
        this.appUserId = user.getAppUserId();
        this.keycloakId = user.getKeycloakId();
        this.email = user.getEmail();
        this.roles = user.getRoles();
        this.enabled = user.getEnabled();
        this.fullName = user.getFullName();
        this.phoneNumber = user.getPhoneNumber();
        this.avatarUrl = user.getAvatarUrl();
    }
}