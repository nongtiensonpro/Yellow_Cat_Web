package org.yellowcat.backend.common.security.keycloak;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.security.annotation.RequirePermission;
import org.yellowcat.backend.common.security.annotation.SecuredResource;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@SecuredResource(resource = "Admin_Web", description = "Quản lý người dùng và phân quyền")
public class UserManagementController {

    private final KeycloakAdminService keycloakAdminService;

    public UserManagementController(KeycloakAdminService keycloakAdminService) {
        this.keycloakAdminService = keycloakAdminService;
    }

    @Operation(summary = "Lấy tất cả các người dùng với các vai trò của họ", description = "Điểm cuối này trả về danh sách tất cả các người dùng với các vai trò được gán. Chỉ có người dùng với vai trò 'Admin_Web' mới có thể truy cập điểm cuối này.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Một danh sách người dùng với các vai trò của họ"),
            @ApiResponse(responseCode = "401", description = "Không được ủy quyền - Người dùng không có vai trò yêu cầu"),
            @ApiResponse(responseCode = "403", description = "Từ chối truy cập - Người dùng không có quyền truy cập vào điểm cuối này")
    })
    @GetMapping
    @RequirePermission(permission = "user.view", description = "Xem danh sách người dùng")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(keycloakAdminService.getUsersWithRoles());
    }

    @Operation(summary = "Lấy danh sách các vai trò có sẵn", description = "Điểm cuối này trả về danh sách tất cả các vai trò client có sẵn trong hệ thống. Chỉ có người dùng với vai trò 'Admin_Web' mới có thể truy cập điểm cuối này.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Danh sách các vai trò có sẵn"),
            @ApiResponse(responseCode = "401", description = "Không được ủy quyền - Người dùng không có vai trò yêu cầu"),
            @ApiResponse(responseCode = "403", description = "Từ chối truy cập - Người dùng không có quyền truy cập vào điểm cuối này")
    })
    @GetMapping("/available-roles")
    @RequirePermission(permission = "user.manage_roles", description = "Xem danh sách vai trò có sẵn")
    public ResponseEntity<List<String>> getAvailableRoles() {
        return ResponseEntity.ok(keycloakAdminService.getAvailableClientRoles());
    }

    @Operation(summary = "Gán các vai trò cho một người dùng", description = "Điểm cuối này gán các vai trò cho một người dùng cụ thể. Chỉ có người dùng với vai trò 'Admin_Web' mới có thể truy cập điểm cuối này.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Các vai trò đã được gán thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ - ID người dùng hoặc vai trò không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Không được ủy quyền - Người dùng không có vai trò yêu cầu"),
            @ApiResponse(responseCode = "403", description = "Từ chối truy cập - Người dùng không có quyền truy cập vào điểm cuối này")
    })

    @PutMapping("/{userId}/roles")
    @RequirePermission(permission = "user.assign_roles", description = "Gán vai trò cho người dùng")
    public ResponseEntity<Void> assignRoles(@PathVariable String userId, @RequestBody Map<String, List<String>> roles) {
        keycloakAdminService.assignClientRoles(userId, roles.get("roles"));
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Loại bỏ các vai trò khỏi một người dùng", description = "Điểm cuối này loại bỏ các vai trò khỏi một người dùng cụ thể. Chỉ có người dùng với vai trò 'Admin_Web' mới có thể truy cập điểm cuối này.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Các vai trò đã được loại bỏ thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ - ID người dùng hoặc vai trò không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Không được ủy quyền - Người dùng không có vai trò yêu cầu"),
            @ApiResponse(responseCode = "403", description = "Từ chối truy cập - Người dùng không có quyền truy cập vào điểm cuối này")
    })

    @DeleteMapping("/{userId}/roles")
    @RequirePermission(permission = "user.remove_roles", description = "Xóa vai trò của người dùng")
    public ResponseEntity<Void> removeRoles(@PathVariable String userId, @RequestBody Map<String, List<String>> roles) {
        keycloakAdminService.removeClientRoles(userId, roles.get("roles"));
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Kích hoạt tài khoản người dùng", description = "Điểm cuối này kích hoạt tài khoản của một người dùng cụ thể. Chỉ có người dùng với vai trò 'Admin_Web' mới có thể truy cập điểm cuối này.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tài khoản đã được kích hoạt thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ - ID người dùng không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Không được ủy quyền - Người dùng không có vai trò yêu cầu"),
            @ApiResponse(responseCode = "403", description = "Từ chối truy cập - Người dùng không có quyền truy cập vào điểm cuối này"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    })
    @PutMapping("/{userId}/enable")
    @RequirePermission(permission = "user.enable", description = "Kích hoạt tài khoản người dùng")
    public ResponseEntity<Void> enableUser(@PathVariable String userId) {
        keycloakAdminService.enableUser(userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Vô hiệu hóa tài khoản người dùng", description = "Điểm cuối này vô hiệu hóa tài khoản của một người dùng cụ thể. Chỉ có người dùng với vai trò 'Admin_Web' mới có thể truy cập điểm cuối này.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tài khoản đã được vô hiệu hóa thành công"),
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ - ID người dùng không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Không được ủy quyền - Người dùng không có vai trò yêu cầu"),
            @ApiResponse(responseCode = "403", description = "Từ chối truy cập - Người dùng không có quyền truy cập vào điểm cuối này"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    })
    @PutMapping("/{userId}/disable")
    @RequirePermission(permission = "user.disable", description = "Vô hiệu hóa tài khoản người dùng")
    public ResponseEntity<Void> disableUser(@PathVariable String userId) {
        keycloakAdminService.disableUser(userId);
        return ResponseEntity.ok().build();
    }
}