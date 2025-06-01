package org.yellowcat.backend.CallApiAddress;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.yellowcat.backend.CallApiAddress.dto.HuyenDTO;
import org.yellowcat.backend.CallApiAddress.dto.TinhDTO;
import org.yellowcat.backend.CallApiAddress.dto.XaDTO;

import java.util.List;

@RestController
@RequestMapping("/api/address")
public class DiaChiController {
    private final DiaChiService diaChiService;

    public DiaChiController(DiaChiService diaChiService) {
        this.diaChiService = diaChiService;
    }

    @GetMapping("/provinces")
    public List<TinhDTO> getProvinces() {
        return diaChiService.getAllTinh();
    }

    @GetMapping("/districts/{provinceCode}")
    public HuyenDTO[] getDistricts(@PathVariable String provinceCode) {
        return diaChiService.getHuyenByTinhCode(provinceCode);
    }

    @GetMapping("/wards/{districtCode}")
    public XaDTO[] getWards(@PathVariable String districtCode) {
        return diaChiService.getXaByHuyenCode(districtCode);
    }
}
