package org.yellowcat.backend.address;


import io.swagger.v3.oas.annotations.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.address.dto.AddressesDTO;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/addresses")
public class AddressesController {

    @Autowired
    private AddressService addressService;

    @GetMapping
    @Operation(summary = "Lấy tất cả địa chỉ của người dùng", description = "Trả về danh sách các địa chỉ theo phân trang")
    public ResponseEntity<?> getAllAddresses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<AddressesDTO> addressPage = addressService.findAllAddresses(pageable);
        PageResponse<AddressesDTO> pageResponse = new PageResponse<>(addressPage);

        return ResponseEntityBuilder.success(pageResponse);
    }

    @GetMapping("/user/{keycloakId}")
    @Operation(summary = "Lấy tất cả địa chỉ của người dùng theo ID", description = "Trả về danh sách các địa chỉ của người dùng theo ID và phân trang")
    public ResponseEntity<?> keycloakId(
            @PathVariable UUID keycloakId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<AddressesDTO> addressPage = addressService.findAllByAppUserKeycloakId(keycloakId, pageable);
        PageResponse<AddressesDTO> pageResponse = new PageResponse<>(addressPage);

        return ResponseEntityBuilder.success(pageResponse);
    }

    @PostMapping("/user/create/{keycloakId}")
    public ApiResponse create(@RequestBody AddressesDTO addressDTO, @PathVariable UUID  keycloakId) {
        try {
        AddressesDTO createdAddress = addressService.create(addressDTO, keycloakId);
        return ApiResponse.success(createdAddress);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error(org.springframework.http.HttpStatus.BAD_REQUEST, "Lỗi khi thêm địa chỉ", e.getMessage());
        }
    }


    @PutMapping("/user/update/{keycloakId}")
    public ApiResponse update(@RequestBody AddressesDTO addressDTO, @PathVariable UUID keycloakId) {
        AddressesDTO updatedAddress = addressService.update(addressDTO, keycloakId);
        return ApiResponse.success(updatedAddress);
    }

    @Operation(summary = "Xóa nhiều address", description = "Xóa danh sách address theo ID và trả về kết quả")
    @DeleteMapping("user/delete")
    public ResponseEntity<?> deleteMultiple(@RequestBody List<Integer> ids) {
        boolean isDeleted = addressService.deleteAll(ids);
        if (isDeleted) {
            return ResponseEntityBuilder.success("Đã xóa các address thành công");
        } else {
            return ResponseEntityBuilder.error(
                    HttpStatus.BAD_REQUEST,
                    "Xóa address thất bại",
                    "Một hoặc nhiều address không tồn tại hoặc đã bị xóa rồi"
            );
        }
    }


}
