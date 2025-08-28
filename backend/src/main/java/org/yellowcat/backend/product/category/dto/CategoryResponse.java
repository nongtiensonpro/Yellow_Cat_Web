package org.yellowcat.backend.product.category.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Integer id;
    private String name;
    private String description;
    private Boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
