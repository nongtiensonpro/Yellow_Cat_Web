package org.yellowcat.backend.product.returnRequest;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.product.returnRequest.dto.request.CreateReturnImageDTO;
import org.yellowcat.backend.product.returnRequest.dto.request.CreateReturnRequestDTO;
import org.yellowcat.backend.product.returnRequest.dto.request.UpdateReturnStatusDTO;
import org.yellowcat.backend.product.returnRequest.dto.response.ReturnImageResponse;
import org.yellowcat.backend.product.returnRequest.dto.response.ReturnItemDetailDTO;
import org.yellowcat.backend.product.returnRequest.dto.response.ReturnItemResponseDTO;
import org.yellowcat.backend.product.returnRequest.dto.response.ReturnRequestResponse;

@RestController
@RequestMapping("/api/return-request")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class ReturnRequestController {
    ReturnService returnService;

    // 1. Tạo yêu cầu hoàn trả
    @PostMapping
    public ResponseEntity<ReturnRequestResponse> createReturnRequest(@RequestBody CreateReturnRequestDTO dto) {
        ReturnRequestResponse request = returnService.createReturnRequest(dto);
        return ResponseEntity.ok(request);
    }

    // 2. Cập nhật trạng thái yêu cầu hoàn trả
    @PutMapping("/{returnRequestId}/status")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<ReturnRequestResponse> updateReturnStatus(
            @PathVariable Integer returnRequestId,
            @RequestBody UpdateReturnStatusDTO dto) {
        ReturnRequestResponse updated = returnService.updateReturnStatus(returnRequestId, dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{returnRequestId}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<ReturnRequestResponse> completeReturn(
            @PathVariable Integer returnRequestId) {
        ReturnRequestResponse updated = returnService.completeReturn(returnRequestId);
        return ResponseEntity.ok(updated);
    }

    // 3. Upload ảnh hoàn trả
    @PostMapping("/images")
    public ResponseEntity<ReturnImageResponse> uploadReturnImage(@RequestBody CreateReturnImageDTO dto) {
        ReturnImageResponse image = returnService.createReturnImage(dto);
        return ResponseEntity.ok(image);
    }

    // 4. Lấy danh sách các yêu cầu hoàn trả (phân trang)
    @GetMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<Page<ReturnRequestResponse>> getAllReturnRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ReturnRequestResponse> responses = returnService.findAllReturnRequests(page, size);
        return ResponseEntity.ok(responses);
    }

    // 5. Lấy danh sách các sản phẩm được hoàn trong một yêu cầu (phân trang)
    @GetMapping("/{returnRequestId}/items")
    public ResponseEntity<Page<ReturnItemResponseDTO>> getReturnItemsByRequestId(
            @PathVariable Integer returnRequestId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ReturnItemResponseDTO> items = returnService.getReturnItemsByRequestId(returnRequestId, page, size);
        return ResponseEntity.ok(items);
    }

    // 6. Lấy thông tin chi tiết của 1 item hoàn trả (bao gồm ảnh)
    @GetMapping("/items/{returnItemId}")
    public ResponseEntity<ReturnItemDetailDTO> getReturnItemDetail(@PathVariable Integer returnItemId) {
        ReturnItemDetailDTO detail = returnService.getReturnItemDetail(returnItemId);
        return ResponseEntity.ok(detail);
    }
}
