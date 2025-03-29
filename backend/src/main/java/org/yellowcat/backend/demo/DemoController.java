package org.yellowcat.backend.demo;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.yellowcat.backend.response.PageResponse;
import org.yellowcat.backend.response.ResponseEntityBuilder;

import java.util.List;
@RestController
@RequestMapping("/demo/all")
public class DemoController {

    private final DemoRepository demoRepository;

    public DemoController(DemoRepository demoRepository) {
        this.demoRepository = demoRepository;
    }

    @GetMapping
    @Operation(summary = "Nhận tất cả dữ liệu demo", description = "Điểm cuối này trả về tất cả dữ liệu demo với hỗ trợ phân trang")
    public ResponseEntity<?> getAllDemos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Demomodel> demoPage = demoRepository.findAll(pageable);
        PageResponse<Demomodel> pageResponse = new PageResponse<>(demoPage);

        return ResponseEntityBuilder.success(pageResponse);
    }
}
