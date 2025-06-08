package org.yellowcat.backend.CallApiAddress.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TinhDTO {
    private String name;
    private String code;
    private List<HuyenDTO> districts;
}
