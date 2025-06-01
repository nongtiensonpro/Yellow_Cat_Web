package org.yellowcat.backend.CallApiAddress.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class TinhDTO {
    private String name;
    private String code;
    private List<HuyenDTO> districts;
}
