package org.yellowcat.backend.online_selling.productwaitlist;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/waitlist")
@RequiredArgsConstructor
public class ProductWaitlistController {
    private final ProductWaitlistService waitlistService;

    @PostMapping("/submit")
    public ResponseEntity<?> submit(@RequestBody WaitlistRequestDTO dto) {
        String code = waitlistService.submitRequest(dto);
        return ResponseEntity.ok("Đã ghi nhận yêu cầu. Mã theo dõi: " + code);
    }

    @PutMapping("/{id}/notify")
    public ResponseEntity<?> notify(@PathVariable Integer id) {
        waitlistService.notifyCustomer(id);
        return ResponseEntity.ok("Đã gửi thông báo cho khách.");
    }

    @GetMapping("/search")
    public ResponseEntity<?> findByCode(@RequestParam("code") String code) {
        var request = waitlistService.findByCode(code);
        return ResponseEntity.ok(request);
    }

    @DeleteMapping("/cancel")
    public ResponseEntity<?> cancelByCode(@RequestParam("code") String code) {
        waitlistService.cancelRequestByCode(code);
        return ResponseEntity.ok("Đã hủy yêu cầu với mã: " + code);
    }

    @PutMapping("/{code}/status")
    public ResponseEntity<?> updateWaitlistStatus(@PathVariable String code,
                                                  @RequestBody WaitlistUpdateRequestDTO dto) {
        waitlistService.updateStatusByCode(code, dto);
        return ResponseEntity.ok("Đã cập nhật phiếu chờ.");
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<?> userCancelRequest(@PathVariable String code) {
        WaitlistUpdateRequestDTO dto = new WaitlistUpdateRequestDTO();
        dto.setNewStatus(WaitlistStatus.CUSTOMER_CANCELLED);
        waitlistService.updateStatusByCode(code, dto);
        return ResponseEntity.ok("Bạn đã huỷ yêu cầu thành công.");
    }

//    @GetMapping("/{code}")
//    public ResponseEntity<?> getWaitlistByCode(@PathVariable String code) {
//        return ResponseEntity.ok(waitlistService.findByCode(code));
//    }

    @PostMapping("/activate")
    public ResponseEntity<?> activateWaitlists(@RequestBody List<Integer> variantIds) {
        waitlistService.activateWaitlistsByVariantIds(variantIds);
        return ResponseEntity.ok("Đã xử lý kích hoạt các phiếu chờ liên quan.");
    }


}
