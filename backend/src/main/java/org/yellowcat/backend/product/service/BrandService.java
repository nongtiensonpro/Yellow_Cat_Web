package org.yellowcat.backend.product.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.yellowcat.backend.product.brand.dto.BrandDTO;
import org.yellowcat.backend.product.brand.dto.CreateBrandRequest;
import org.yellowcat.backend.product.brand.dto.UpdateBrandRequest;


public interface BrandService {
    List<BrandDTO> getAllBrands();
    Page<BrandDTO> getBrandsWithPagination(Pageable pageable);
    BrandDTO getBrandById(Integer id);
    BrandDTO createBrand(CreateBrandRequest request);
    BrandDTO updateBrand(Integer id, UpdateBrandRequest request);
    void deleteBrand(Integer id);
}