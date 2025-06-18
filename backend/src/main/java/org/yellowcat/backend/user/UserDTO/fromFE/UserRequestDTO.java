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
public class UserRequestDTO {
    private UUID id;
    private String name;
    private String email;
    private List<String> roles;

    public UserRequestDTO(AppUser user) {
        this.id = user.getKeycloakId();
        this.email = user.getEmail();
        this.name = user.getFullName();
        this.roles = user.getRoles();
    }

}
