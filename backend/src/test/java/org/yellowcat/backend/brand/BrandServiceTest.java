package org.yellowcat.backend.brand;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.yellowcat.backend.common.websocket.EntityMessage;
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.brand.Brand;
import org.yellowcat.backend.product.brand.BrandRepository;
import org.yellowcat.backend.product.brand.BrandService;
import org.yellowcat.backend.product.brand.dto.BrandCreateDto;
import org.yellowcat.backend.product.brand.dto.BrandDTO;
import org.yellowcat.backend.product.brand.dto.BrandUpdateDto;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;


class BrandServiceTest {

    @Mock
    private BrandRepository brandRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private BrandService brandService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    private Brand createSampleBrand() {
        Brand brand = new Brand();
        brand.setId(1);
        brand.setBrandName("Test Brand");
        brand.setBrandInfo("Test brand info");
        brand.setLogoPublicId("logo123");
        brand.setCreatedAt(Instant.now());
        brand.setUpdatedAt(Instant.now());

        Set<Product> products = new LinkedHashSet<>(); // giả sử chưa cần test sản phẩm chi tiết
        brand.setProducts(products);

        return brand;
    }

    @Test
    void testGetAllBrands() {
        Brand brand = createSampleBrand();
        Page<Brand> brandPage = new PageImpl<>(List.of(brand));
        Pageable pageable = PageRequest.of(0, 10);

        when(brandRepository.findAllWithProducts(pageable)).thenReturn(brandPage);

        Page<BrandDTO> result = brandService.getAllBrands(pageable);

        assertThat(result).hasSize(1);
        assertThat(result.getContent().get(0).getBrandName()).isEqualTo("Test Brand");
    }

    @Test
    void testGetBrandByIdSuccess() {
        Brand brand = createSampleBrand();
        when(brandRepository.findById(1)).thenReturn(Optional.of(brand));

        BrandDTO result = brandService.getBrandById(1);

        assertThat(result).isNotNull();
        assertThat(result.getBrandName()).isEqualTo("Test Brand");
    }

    @Test
    void testGetBrandByIdNotFound() {
        when(brandRepository.findById(1)).thenReturn(Optional.empty());

        BrandDTO result = brandService.getBrandById(1);

        assertThat(result).isNull();
    }

    @Test
    void testDeleteBrandSuccess() {
        Brand brand = createSampleBrand();
        when(brandRepository.existsById(1)).thenReturn(true);
        when(brandRepository.findById(1)).thenReturn(Optional.of(brand));

        boolean result = brandService.deleteBrand(1);

        assertThat(result).isTrue();
        verify(brandRepository).deleteById(1);
        verify(messagingTemplate).convertAndSend(eq("/topic/brands"), any(EntityMessage.class));
    }

    @Test
    void testDeleteBrandNotExists() {
        when(brandRepository.existsById(1)).thenReturn(false);

        boolean result = brandService.deleteBrand(1);

        assertThat(result).isFalse();
        verify(brandRepository, never()).deleteById(anyInt());
    }

    @Test
    void testAddBrand() {
        BrandCreateDto dto = new BrandCreateDto("New Brand test", "logoTest", "New brand info Test");
        Brand savedBrand = createSampleBrand();
        savedBrand.setBrandName("New Brand");

        when(brandRepository.save(any())).thenReturn(savedBrand);

        BrandDTO result = brandService.addBrand(dto);

        assertThat(result.getBrandName()).isEqualTo("New Brand");
        verify(messagingTemplate).convertAndSend(eq("/topic/brands"), any(EntityMessage.class));
    }

    @Test
    void testUpdateBrandSuccess() {
        Brand existingBrand = createSampleBrand();
        BrandUpdateDto dto = new BrandUpdateDto(1, "Updated Brand", "newLogoId", "Updated info");

        when(brandRepository.findById(1)).thenReturn(Optional.of(existingBrand));
        when(brandRepository.save(any())).thenReturn(existingBrand);

        BrandDTO result = brandService.updateBrand(1, dto);

        assertThat(result).isNotNull();
        assertThat(result.getBrandName()).isEqualTo("Updated Brand");
        verify(messagingTemplate).convertAndSend(eq("/topic/brands"), any(EntityMessage.class));
    }


    @Test
    void testUpdateBrandNotFound() {
        when(brandRepository.findById(1)).thenReturn(Optional.empty());

        BrandUpdateDto dto = new BrandUpdateDto(11, "New Brand Name", "newLogoId", "Updated info");
        BrandDTO result = brandService.updateBrand(1, dto);

        assertThat(result).isNull();
    }

}
