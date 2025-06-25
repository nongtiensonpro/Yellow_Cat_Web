package org.yellowcat.backend.user;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.common.security.keycloak.KeycloakAdminService;
import org.yellowcat.backend.common.security.keycloak.UserDTO;
import org.yellowcat.backend.user.UserDTO.fromFE.UserRequestDTO;
import org.yellowcat.backend.user.UserDTO.fromFE.UserUpdateDTO;


import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class AppUserController {

    @Autowired
    private  KeycloakAdminService keycloakAdminService;

    @Autowired
    private AppUserService appUserService;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        List<UserDTO> users = keycloakAdminService.getUsersWithRoles();
        return ResponseEntityBuilder.success(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Integer id) {
        Optional<AppUser> appUser = appUserService.findById(id);
        Optional<UserRequestDTO> appUserDTO = appUser.map(UserRequestDTO::new);
        if (appUserDTO.isEmpty()) {
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Người dùng không tồn tại", null);
        }

        return ResponseEntityBuilder.success(appUserDTO.get());
    }

    @GetMapping("/keycloak-user/{keycloakId}")
    public ResponseEntity<?> getUserByKeycloakId(@PathVariable UUID keycloakId) {
        Optional<AppUser> appUser = appUserService.findByKeycloakId(keycloakId);
        if (appUser.isEmpty()) {
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Người dùng không tồn tại", null);
        }
        
        return ResponseEntityBuilder.success(appUser.get());
    }

    @PutMapping("/update-profile/{appUserId}")
    public ResponseEntity<?> updateUserProfile(@PathVariable Integer appUserId, @RequestBody UserUpdateDTO userUpdateDTO) {
        try {
            AppUser updatedUser = appUserService.updateUserProfile(appUserId, userUpdateDTO);
            return ResponseEntityBuilder.success("Cập nhật thông tin người dùng thành công", updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Cập nhật thất bại", e.getMessage());
        } catch (Exception e) {
            return ResponseEntityBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống", e.getMessage());
        }
    }

//    @PostMapping("/creat/{key}")
//    public ApiResponse createUser(@RequestBody UserRequestDTO user) {
//        UserRequestDTO createdUser = appUserService.create(user);
//        return ApiResponse.success(createdUser);
//    }

//    @PutMapping("/update/{key}")
//    public ApiResponse updateUser( @RequestBody  UserRequestDTO user) {
//       UserRequestDTO audto = appUserService.update(user);
//        return  ApiResponse.success(audto);
//    }

    @DeleteMapping("/delete/{keycloakId}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID keycloakId) {
        boolean isDeleted = appUserService.delete(keycloakId);
        if (isDeleted) {
            // Truyền null làm data nếu chỉ muốn gửi message
            return ResponseEntityBuilder.success("Người dùng đã được xóa thành công", null);
        } else {
            return ResponseEntityBuilder.error(
                    HttpStatus.BAD_REQUEST,
                    "Xóa Người dùng thất bại",
                    "Người dùng không tồn tại hoặc đã bị xóa rồi"
            );
        }
    }



    @GetMapping("/keycloak/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable String id) {
        UserDTO user = keycloakAdminService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/me")
    public ResponseEntity<ApiResponse<Void>> getOrCreateUser(
            @RequestBody UserRequestDTO userDTO,
            HttpServletRequest request
    ) {
        try {
            appUserService.findOrCreateAppUser(userDTO);
            ApiResponse<Void> response = new ApiResponse<>(HttpStatus.OK, "successfully", (Void) null);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<Void> errorResponse = new ApiResponse<>(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "failed",
                    e.getMessage(),
                    request.getRequestURI()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }


}

