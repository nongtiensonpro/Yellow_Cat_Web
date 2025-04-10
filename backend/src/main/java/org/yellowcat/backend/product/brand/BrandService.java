package org.yellowcat.backend.product.brand;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.config.EntityMessage;
import org.yellowcat.backend.config.WebSocketHandler;
import org.yellowcat.backend.product.brand.dto.BrandCreateDto;
import org.yellowcat.backend.product.brand.dto.BrandDTO;
import org.yellowcat.backend.product.brand.dto.BrandUpdateDto;

import java.time.Instant;

@Service
public class BrandService {

    private final BrandRepository brandRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public BrandService(BrandRepository brandRepository, WebSocketHandler webSocketHandler, SimpMessagingTemplate messagingTemplate) {
        this.brandRepository = brandRepository;
        this.messagingTemplate = messagingTemplate;
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
            Brand brand = brandRepository.findById(id).get();
            BrandDTO result = convertToDTO(brand);
            messagingTemplate.convertAndSend("/topic/brands",new EntityMessage( "delete",result));
            brandRepository.deleteById(id);
            return true;
        }else {
            return false;
        }
    }



    public BrandDTO addBrand(BrandCreateDto brandDTO) {
        Brand newBrand = new Brand();
        newBrand.setBrandName(brandDTO.brandName());
        newBrand.setLogoPublicId(brandDTO.logoPublicId());
        newBrand.setBrandInfo(brandDTO.brandInfo());
        Brand savedBrand = brandRepository.save(newBrand);
        messagingTemplate.convertAndSend("/topic/brands", new EntityMessage( "add", convertToDTO(savedBrand)                                                       ));
        return new BrandDTO(savedBrand);
    }

    public BrandDTO updateBrand(Integer id, BrandUpdateDto brandDTO) {
        Brand existingBrand = brandRepository.findById(id).orElse(null);
        if (existingBrand!= null) {
            existingBrand.setBrandName(brandDTO.brandName());
            existingBrand.setLogoPublicId(brandDTO.logoPublicId());
            existingBrand.setBrandInfo(brandDTO.brandInfo());
            existingBrand.setUpdatedAt(Instant.now());
            Brand updatedBrand = brandRepository.save(existingBrand);
            messagingTemplate.convertAndSend("/topic/brands", new EntityMessage( "update", convertToDTO(updatedBrand)                                                       ));
            return new BrandDTO(updatedBrand);
        } else {
            return null;
        }
    }
    private BrandDTO convertToDTO(Brand brand) {
        BrandDTO brandDTO = new BrandDTO();
        brandDTO.setId(brand.getId());
        brandDTO.setBrandName(brand.getBrandName());
        brandDTO.setLogoPublicId(brand.getLogoPublicId());
        brandDTO.setBrandInfo(brand.getBrandInfo());
        brandDTO.setCreatedAt(brand.getCreatedAt());
        brandDTO.setUpdatedAt(brand.getUpdatedAt());
        return brandDTO;
    }
}


