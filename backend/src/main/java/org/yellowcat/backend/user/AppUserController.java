package org.yellowcat.backend.user;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.user.UserDTO.AppUserDTO;


import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class AppUserController {

    @Autowired
    private AppUserService appUserService;

    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AppUserDTO> addressPage = appUserService.findAll(pageable);
        PageResponse<AppUserDTO> pageResponse = new PageResponse<>(addressPage);
        return ResponseEntityBuilder.success(pageResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Integer id) {
        Optional<AppUser> appUser = appUserService.findById(id);
        Optional<AppUserDTO> appUserDTO = appUser.map(AppUserDTO::new);
        if (appUserDTO.isEmpty()) {
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Người dùng không tồn tại", null);
        }

        return ResponseEntityBuilder.success(appUserDTO.get());
    }


    @PostMapping("/creat/{key}")
    public ApiResponse createUser(@RequestBody AppUserDTO user, @PathVariable String key) {
        AppUserDTO createdUser = appUserService.create(user,key);
        return ApiResponse.success(createdUser);
    }

    @PutMapping("/update/{key}")
    public ApiResponse updateUser( @RequestBody  AppUserDTO user, @PathVariable String key) {
       AppUserDTO audto =appUserService.update(user,key);
        return  ApiResponse.success(audto);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        boolean isDeleted = appUserService.delete(id);
        if (isDeleted) {
            return ResponseEntityBuilder.success("Brand đã được xóa thành công");
        } else {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST,"Xóa Brand thất bại","Brand không tồn tại hoặc đã bị xóa rồi");
        }
}
}

