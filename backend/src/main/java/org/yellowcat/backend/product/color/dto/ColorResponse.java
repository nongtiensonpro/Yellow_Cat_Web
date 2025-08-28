package org.yellowcat.backend.product.color.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ColorResponse {
    private Integer id;
    private String name;
    private Boolean status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
