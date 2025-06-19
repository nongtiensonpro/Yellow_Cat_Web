package org.yellowcat.backend.common.security.keycloak;

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

    public List<String> getAvailableClientRoles() {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            
            // Tìm client UUID như trong SecurityConfig
            ClientRepresentation client = realmResource.clients()
                    .findByClientId(clientId)
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Client " + clientId + " không tồn tại"));
            String clientUuid = client.getId();

            // Lấy tất cả client roles
            List<RoleRepresentation> clientRoles = realmResource.clients()
                    .get(clientUuid)
                    .roles()
                    .list();

            return clientRoles.stream()
                    .map(RoleRepresentation::getName)
                    .filter(roleName -> !roleName.startsWith("default-roles-")) // Lọc bỏ default roles
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy danh sách client roles: " + e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách vai trò: " + e.getMessage(), e);
        }
    }

    public void assignClientRoles(String userId, List<String> roleNames) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            
            // Tìm client UUID
            ClientRepresentation client = realmResource.clients()
                    .findByClientId(clientId)
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Client " + clientId + " không tồn tại"));
            String clientUuid = client.getId();

            // Lấy client roles representations
            List<RoleRepresentation> roles = roleNames.stream()
                    .map(roleName -> {
                        try {
                            return realmResource.clients()
                                    .get(clientUuid)
                                    .roles()
                                    .get(roleName)
                                    .toRepresentation();
                        } catch (Exception e) {
                            throw new RuntimeException("Vai trò '" + roleName + "' không tồn tại");
                        }
                    })
                    .collect(Collectors.toList());

            // Gán client roles cho user
            realmResource.users()
                    .get(userId)
                    .roles()
                    .clientLevel(clientUuid)
                    .add(roles);
                    
            System.out.println("Đã gán client roles " + roleNames + " cho user: " + userId);
        } catch (Exception e) {
            System.err.println("Lỗi khi gán client roles cho user " + userId + ": " + e.getMessage());
            throw new RuntimeException("Không thể gán vai trò cho người dùng: " + e.getMessage(), e);
        }
    }

    public void removeClientRoles(String userId, List<String> roleNames) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            
            // Tìm client UUID
            ClientRepresentation client = realmResource.clients()
                    .findByClientId(clientId)
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Client " + clientId + " không tồn tại"));
            String clientUuid = client.getId();

            // Lấy client roles representations
            List<RoleRepresentation> roles = roleNames.stream()
                    .map(roleName -> {
                        try {
                            return realmResource.clients()
                                    .get(clientUuid)
                                    .roles()
                                    .get(roleName)
                                    .toRepresentation();
                        } catch (Exception e) {
                            throw new RuntimeException("Vai trò '" + roleName + "' không tồn tại");
                        }
                    })
                    .collect(Collectors.toList());

            // Xóa client roles của user
            realmResource.users()
                    .get(userId)
                    .roles()
                    .clientLevel(clientUuid)
                    .remove(roles);
                    
            System.out.println("Đã xóa client roles " + roleNames + " của user: " + userId);
        } catch (Exception e) {
            System.err.println("Lỗi khi xóa client roles của user " + userId + ": " + e.getMessage());
            throw new RuntimeException("Không thể xóa vai trò của người dùng: " + e.getMessage(), e);
        }
    }

    public UserDTO getUserById(String userId) {
        RealmResource realmResource = keycloak.realm(realm);
        UserRepresentation user = realmResource.users().get(userId).toRepresentation();

        // Lấy client UUID
        ClientRepresentation client = realmResource.clients()
                .findByClientId(clientId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Client " + clientId + " không tồn tại"));
        String clientUuid = client.getId();

        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setEmail(user.getEmail());
        userDTO.setFirstName(user.getFirstName());
        userDTO.setLastName(user.getLastName());
        userDTO.setEnabled(user.isEnabled());

        List<String> realmRoleNames = new ArrayList<>();
        List<String> clientRoleNames = new ArrayList<>();

        try {
            List<RoleRepresentation> realmRoles = realmResource.users()
                    .get(userId)
                    .roles()
                    .realmLevel()
                    .listAll();
            realmRoleNames = realmRoles.stream()
                    .map(RoleRepresentation::getName)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy Realm Roles: " + e.getMessage());
        }

        try {
            List<RoleRepresentation> clientRoles = realmResource.users()
                    .get(userId)
                    .roles()
                    .clientLevel(clientUuid)
                    .listAll();
            clientRoleNames = clientRoles.stream()
                    .map(RoleRepresentation::getName)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy Client Roles: " + e.getMessage());
        }

        List<String> allRoles = new ArrayList<>();
        allRoles.addAll(realmRoleNames);
        allRoles.addAll(clientRoleNames);

        userDTO.setRoles(allRoles);
        userDTO.setRealmRoles(realmRoleNames);
        userDTO.setClientRoles(clientRoleNames);

        return userDTO;
    }

    public void enableUser(String userId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserRepresentation user = realmResource.users().get(userId).toRepresentation();
            user.setEnabled(true);
            realmResource.users().get(userId).update(user);
            System.out.println("Đã kích hoạt tài khoản user: " + userId);
        } catch (Exception e) {
            System.err.println("Lỗi khi kích hoạt user " + userId + ": " + e.getMessage());
            throw new RuntimeException("Không thể kích hoạt tài khoản người dùng: " + e.getMessage(), e);
        }
    }

    public void disableUser(String userId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserRepresentation user = realmResource.users().get(userId).toRepresentation();
            user.setEnabled(false);
            realmResource.users().get(userId).update(user);
            System.out.println("Đã vô hiệu hóa tài khoản user: " + userId);
        } catch (Exception e) {
            System.err.println("Lỗi khi vô hiệu hóa user " + userId + ": " + e.getMessage());
            throw new RuntimeException("Không thể vô hiệu hóa tài khoản người dùng: " + e.getMessage(), e);
        }
    }

}