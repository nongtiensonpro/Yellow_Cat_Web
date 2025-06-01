package org.yellowcat.backend.CallApiAddress;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.yellowcat.backend.CallApiAddress.dto.HuyenDTO;
import org.yellowcat.backend.CallApiAddress.dto.TinhDTO;
import org.yellowcat.backend.CallApiAddress.dto.XaDTO;

import java.util.List;

@Service
public class DiaChiService {
    private final RestTemplate restTemplate = new RestTemplate();

    public List<TinhDTO> getAllTinh() {
        String url = "https://provinces.open-api.vn/api/p/";
        ResponseEntity<List<TinhDTO>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<TinhDTO>>() {});
        return response.getBody();
    }

    public HuyenDTO[] getHuyenByTinhCode(String tinhCode) {
        String url = "https://provinces.open-api.vn/api/p/" + tinhCode + "?depth=2";
        TinhDTO tinh = restTemplate.getForObject(url, TinhDTO.class);
        return tinh != null ? tinh.getDistricts().toArray(new HuyenDTO[0]) : new HuyenDTO[0];
    }

    public XaDTO[] getXaByHuyenCode(String huyenCode) {
        String url = "https://provinces.open-api.vn/api/d/" + huyenCode + "?depth=2";
        HuyenDTO huyen = restTemplate.getForObject(url, HuyenDTO.class);
        return huyen != null ? huyen.getWards().toArray(new XaDTO[0]) : new XaDTO[0];
    }
}
