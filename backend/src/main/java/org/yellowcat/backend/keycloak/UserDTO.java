package org.yellowcat.backend.keycloak;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class UserDTO {
    private String id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private List<String> roles;
    private List<String> realmRoles;
    private List<String> clientRoles;
    private Boolean enabled;
}