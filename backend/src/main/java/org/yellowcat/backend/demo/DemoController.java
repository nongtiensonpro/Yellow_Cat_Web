package org.yellowcat.backend.demo;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
@RestController
@RequestMapping("/demo")
public class DemoController {

    private final DemoRepository demoRepository;

    public DemoController(DemoRepository demoRepository) {
        this.demoRepository = demoRepository;
    }

    @GetMapping("/all")
    @Operation(summary = "Nhận tất cả dữ liệu demo", description = "Điểm cuối này trả về tất cả dữ liệu demo")
    public List<Demomodel> getAllDemos() {
        return demoRepository.findAll();
    }

}
