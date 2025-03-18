package org.yellowcat.backend.keycloak;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class UserManagementController {

    private final KeycloakAdminService keycloakAdminService;

    public UserManagementController(KeycloakAdminService keycloakAdminService) {
        this.keycloakAdminService = keycloakAdminService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(keycloakAdminService.getUsersWithRoles());
    }

    @PutMapping("/{userId}/roles")
    @PreAuthorize("hasAuthority('Admin_Web')")
    public ResponseEntity<Void> assignRoles(@PathVariable String userId, @RequestBody Map<String, List<String>> roles) {
        keycloakAdminService.assignRoles(userId, roles.get("roles"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/roles")
    @PreAuthorize("hasAuthority('Admin_Web')")
    public ResponseEntity<Void> removeRoles(@PathVariable String userId, @RequestBody Map<String, List<String>> roles) {
        keycloakAdminService.removeRoles(userId, roles.get("roles"));
        return ResponseEntity.ok().build();
    }
}