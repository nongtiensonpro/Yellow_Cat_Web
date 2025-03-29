package org.yellowcat.backend.demo;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.exception.BadRequestException;
import org.yellowcat.backend.exception.ResourceNotFoundException;
import org.yellowcat.backend.response.ResponseEntityBuilder;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller ví dụ để minh họa cách sử dụng ApiResponse và GlobalExceptionHandler
 */
@RestController
@RequestMapping("/api/examples")
public class ExampleController {

    /**
     * Endpoint trả về phản hồi thành công
     */
    @GetMapping("/success")
    @Operation(summary = "Trả về phản hồi thành công", description = "Endpoint này trả về phản hồi thành công với dữ liệu mẫu")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Thành công")
    })
    public ResponseEntity<?> getSuccessResponse() {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "Đây là dữ liệu mẫu");
        data.put("items", new String[]{"Item 1", "Item 2", "Item 3"});

        return ResponseEntityBuilder.success("Yêu cầu thành công", data);
    }

    /**
     * Endpoint trả về phản hồi lỗi Bad Request
     */
    @GetMapping("/bad-request")
    @Operation(summary = "Trả về phản hồi lỗi Bad Request", description = "Endpoint này ném ra BadRequestException để minh họa xử lý lỗi")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ")
    })
    public ResponseEntity<?> getBadRequestResponse() {
        throw new BadRequestException("Yêu cầu không hợp lệ");
    }

    /**
     * Endpoint trả về phản hồi lỗi Not Found
     */
    @GetMapping("/not-found/{id}")
    @Operation(summary = "Trả về phản hồi lỗi Not Found", description = "Endpoint này ném ra ResourceNotFoundException để minh họa xử lý lỗi")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "404", description = "Không tìm thấy tài nguyên")
    })
    public ResponseEntity<?> getNotFoundResponse(@PathVariable("id") String id) {
        throw new ResourceNotFoundException("Tài nguyên", "id", id);
    }

    /**
     * Endpoint tạo tài nguyên mới
     */
    @PostMapping
    @Operation(summary = "Tạo tài nguyên mới", description = "Endpoint này trả về phản hồi Created với dữ liệu mẫu")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Tạo thành công")
    })
    public ResponseEntity<?> createResource(@RequestBody Map<String, Object> resource) {
        // Giả lập tạo tài nguyên
        resource.put("id", "123");
        resource.put("createdAt", java.time.LocalDateTime.now().toString());

        return ResponseEntityBuilder.created(resource);
    }

    /**
     * Endpoint cập nhật tài nguyên
     */
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật tài nguyên", description = "Endpoint này trả về phản hồi thành công sau khi cập nhật")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy tài nguyên")
    })
    public ResponseEntity<?> updateResource(@PathVariable("id") String id, @RequestBody Map<String, Object> resource) {
        // Kiểm tra tài nguyên tồn tại
        if ("999".equals(id)) {
            throw new ResourceNotFoundException("Tài nguyên", "id", id);
        }

        // Giả lập cập nhật tài nguyên
        resource.put("id", id);
        resource.put("updatedAt", java.time.LocalDateTime.now().toString());

        return ResponseEntityBuilder.success("Cập nhật thành công", resource);
    }
}