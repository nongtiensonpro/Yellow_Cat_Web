package org.yellowcat.backend.keycloak;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.ClientRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class KeycloakAdminService {

    @Value("${keycloak.auth-server-url}")
    private String authServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.resource}")
    private String clientId;

    private Keycloak keycloak;

    @PostConstruct
    public void initKeycloak() {
        keycloak = KeycloakBuilder.builder()
                .serverUrl(authServerUrl)
                .realm("master")
                .clientId("admin-cli")
                .username("admin")
                .password("admin")
                .build();
    }

    public List<UserDTO> getUsersWithRoles() {
        RealmResource realmResource = keycloak.realm(realm);
        List<UserRepresentation> users = realmResource.users().list();
    
        // Tìm UUID của client "YellowCatCompanyWeb"
        ClientRepresentation client = realmResource.clients()
                .findByClientId(clientId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Client " + clientId + " không tồn tại"));
        String clientUuid = client.getId();
    
        return users.stream().map(user -> {
            UserDTO userDTO = new UserDTO();
            userDTO.setId(user.getId());
            userDTO.setUsername(user.getUsername());
            userDTO.setEmail(user.getEmail());
            userDTO.setFirstName(user.getFirstName());
            userDTO.setLastName(user.getLastName());
            userDTO.setEnabled(user.isEnabled());
    
            List<String> allRoles = new ArrayList<>();
            List<String> realmRoleNames = new ArrayList<>();
            List<String> clientRoleNames = new ArrayList<>();
    
            try {
                // Lấy Realm Roles
                List<RoleRepresentation> realmRoles = realmResource.users()
                        .get(user.getId())
                        .roles()
                        .realmLevel()
                        .listAll();
                realmRoleNames = realmRoles.stream()
                        .map(RoleRepresentation::getName)
                        .collect(Collectors.toList());
                allRoles.addAll(realmRoleNames);
            } catch (Exception e) {
                System.err.println("Lỗi khi lấy Realm Roles cho user " + user.getId() + ": " + e.getMessage());
            }
    
            try {
                // Lấy Client Roles (dùng client UUID)
                List<RoleRepresentation> clientRoles = realmResource.users()
                        .get(user.getId())
                        .roles()
                        .clientLevel(clientUuid)
                        .listAll();
                clientRoleNames = clientRoles.stream()
                        .map(RoleRepresentation::getName)
                        .collect(Collectors.toList());
                allRoles.addAll(clientRoleNames);
            } catch (Exception e) {
                System.err.println("Lỗi khi lấy Client Roles cho user " + user.getId() + " với client " + clientId + ": " + e.getMessage());
            }
    
            userDTO.setRoles(allRoles);
            userDTO.setRealmRoles(realmRoleNames);
            userDTO.setClientRoles(clientRoleNames);
            return userDTO;
        }).collect(Collectors.toList());
    }


    public void assignRoles(String userId, List<String> roleNames) {
        RealmResource realmResource = keycloak.realm(realm);
        UsersResource usersResource = realmResource.users();

        List<RoleRepresentation> roles = roleNames.stream()
                .map(roleName -> realmResource.roles().get(roleName).toRepresentation())
                .toList();

        usersResource.get(userId).roles().realmLevel().add(roles);
    }

    public void removeRoles(String userId, List<String> roleNames) {
        RealmResource realmResource = keycloak.realm(realm);
        UsersResource usersResource = realmResource.users();

        List<RoleRepresentation> roles = roleNames.stream()
                .map(roleName -> realmResource.roles().get(roleName).toRepresentation())
                .toList();

        usersResource.get(userId).roles().realmLevel().remove(roles);
    }


}