package org.yellowcat.backend.product.brand.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import org.yellowcat.backend.config.LinkDTO;

public record BrandResponseDTO(
    Integer brandId,
    String brandName,
    String logoPublicId,
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime createdAt,
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime updatedAt,
    
    List<LinkDTO> links
) {
    // Constructor with default empty links list
    public BrandResponseDTO(Integer brandId, String brandName, String logoPublicId, 
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(brandId, brandName, logoPublicId, createdAt, updatedAt, new ArrayList<>());
    }
    
    // Method to add a link and return a new instance
    public BrandResponseDTO addLink(String rel, String href) {
        List<LinkDTO> newLinks = new ArrayList<>(this.links);
        newLinks.add(new LinkDTO(rel, href));
        return new BrandResponseDTO(this.brandId, this.brandName, this.logoPublicId, 
                                  this.createdAt, this.updatedAt, newLinks);
    }
}