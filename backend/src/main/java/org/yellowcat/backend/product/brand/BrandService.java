package org.yellowcat.backend.product.brand;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.brand.dto.BrandCreateDto;
import org.yellowcat.backend.product.brand.dto.BrandDTO;
import org.yellowcat.backend.product.brand.dto.BrandUpdateDto;

import java.time.Instant;

@Service
public class BrandService {

    private final BrandRepository brandRepository;

    public BrandService(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    public Page<BrandDTO> getAllBrands(Pageable pageable) {
        Page<Brand> brands = brandRepository.findAllWithProducts(pageable);
        return brands.map(BrandDTO::new);
    }

    public BrandDTO getBrandById(Integer id) {
        return brandRepository.findById(id).map(BrandDTO::new).orElse(null);
    }



    public boolean deleteBrand(Integer id) {
        if (brandRepository.existsById(id)) {
            brandRepository.deleteById(id);
            return true;
        }else {
            return false;
        }
    }

    public BrandDTO addBrand(BrandCreateDto brandDTO) {
        Brand newBrand = new Brand();
        newBrand.setBrandName(brandDTO.getBrandName());
        newBrand.setLogoPublicId(brandDTO.getLogoPublicId());
        newBrand.setBrandInfo(brandDTO.getBrandInfo());
        Brand savedBrand = brandRepository.save(newBrand);
        return new BrandDTO(savedBrand);
    }

    public BrandDTO updateBrand(Integer id, BrandUpdateDto brandDTO) {
        Brand existingBrand = brandRepository.findById(id).orElse(null);
        if (existingBrand!= null) {
            existingBrand.setBrandName(brandDTO.getBrandName());
            existingBrand.setLogoPublicId(brandDTO.getLogoPublicId());
            existingBrand.setBrandInfo(brandDTO.getBrandInfo());
            existingBrand.setUpdatedAt(Instant.now());
            Brand updatedBrand = brandRepository.save(existingBrand);
            return new BrandDTO(updatedBrand);
        } else {
            return null;
        }
    }
}