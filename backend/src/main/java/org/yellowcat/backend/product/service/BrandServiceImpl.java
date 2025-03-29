package org.yellowcat.backend.product.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yellowcat.backend.config.exception.DuplicateResourceException;
import org.yellowcat.backend.config.exception.ResourceNotFoundException;
import org.yellowcat.backend.product.brand.Brand;
import org.yellowcat.backend.product.brand.BrandMapper;
import org.yellowcat.backend.product.brand.BrandRepository;
import org.yellowcat.backend.product.brand.dto.BrandDTO;
import org.yellowcat.backend.product.brand.dto.CreateBrandRequest;
import org.yellowcat.backend.product.brand.dto.UpdateBrandRequest;


@Service
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final BrandMapper brandMapper;

    public BrandServiceImpl(BrandRepository brandRepository, BrandMapper brandMapper) {
        this.brandRepository = brandRepository;
        this.brandMapper = brandMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BrandDTO> getAllBrands() {
        return brandRepository.findAll().stream()
                .map(brandMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BrandDTO> getBrandsWithPagination(Pageable pageable) {
        return brandRepository.findAll(pageable)
                .map(brandMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public BrandDTO getBrandById(Integer id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu có ID: " + id));
        return brandMapper.toDto(brand);
    }

    @Override
    @Transactional
    public BrandDTO createBrand(CreateBrandRequest request) {
        if (brandRepository.existsByBrandName(request.brandName())) {
            throw new DuplicateResourceException("Tên thương hiệu đã tồn tại: " + request.brandName());
        }

        Brand brand = brandMapper.toEntity(request);
        brand = brandRepository.save(brand);
        return brandMapper.toDto(brand);
    }

    @Override
    @Transactional
    public BrandDTO updateBrand(Integer id, UpdateBrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu có ID: " + id));

        if (brandRepository.existsByBrandNameAndBrandIdNot(request.brandName(), id)) {
            throw new DuplicateResourceException("Tên thương hiệu đã tồn tại: " + request.brandName());
        }

        brandMapper.updateEntityFromDto(request, brand);
        brand = brandRepository.save(brand);
        return brandMapper.toDto(brand);
    }

    @Override
    @Transactional
    public void deleteBrand(Integer id) {
        if (!brandRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy thương hiệu có ID: " + id);
        }
        brandRepository.deleteById(id);
    }
}