package org.yellowcat.backend.brand;


import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.yellowcat.backend.common.config_api.response.ApiResponse;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.brand.BrandController;
import org.yellowcat.backend.product.brand.BrandService;
import org.yellowcat.backend.product.brand.dto.BrandCreateDto;
import org.yellowcat.backend.product.brand.dto.BrandDTO;
import org.yellowcat.backend.product.brand.dto.BrandUpdateDto;


import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

public class BrandControllerTest {

    @Mock
    private BrandService brandService;

    @InjectMocks
    private BrandController brandController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        objectMapper = new ObjectMapper();
    }

    @Test
    void testGetAllBrands() {
        // Chuẩn bị dữ liệu
        BrandDTO dto1 = new BrandDTO();
        dto1.setId(1);
        dto1.setBrandName("Nike");
        dto1.setBrandInfo("Nike info");
        dto1.setLogoPublicId("logo1");
        dto1.setProductIds(Set.of(1, 5));

        BrandDTO dto2 = new BrandDTO();
        dto2.setId(2);
        dto2.setBrandName("Adidas");
        dto2.setBrandInfo("Adidas info");
        dto2.setLogoPublicId("logo2");
        dto2.setProductIds(Set.of(2));

        Page<BrandDTO> page = new PageImpl<>(List.of(dto1, dto2), PageRequest.of(0, 10), 4);
        when(brandService.getAllBrands(any(Pageable.class))).thenReturn(page);

        // Gọi controller
        ResponseEntity<?> response = brandController.getAllBrands(0, 10);

        assertThat(response.getStatusCodeValue()).isEqualTo(200);

        Object body = response.getBody();
        assertThat(body).isInstanceOf(ApiResponse.class);

        ApiResponse<?> apiResponse = (ApiResponse<?>) body;
        Object data = apiResponse.getData();

        assertThat(data).isInstanceOf(PageResponse.class);

        PageResponse<?> pageResponse = (PageResponse<?>) data;

        assertThat(pageResponse.getCurrentPage()).isEqualTo(0);
        assertThat(pageResponse.getTotalItems()).isEqualTo(2);
        assertThat(pageResponse.getSize()).isEqualTo(10);
        assertThat(pageResponse.isFirst()).isTrue();
        assertThat(pageResponse.isLast()).isTrue();

        // Kiểm tra nội dung brands
        List<?> content = pageResponse.getContent();
        assertThat(content).hasSize(2);

        BrandDTO firstBrand = (BrandDTO) content.get(0);
        assertThat(firstBrand.getBrandName()).isEqualTo("Nike");
        assertThat(firstBrand.getProductIds()).containsExactly(1, 5);

        BrandDTO secondBrand = (BrandDTO) content.get(1);
        assertThat(secondBrand.getBrandName()).isEqualTo("Adidas");
        assertThat(secondBrand.getProductIds()).containsExactly(2);
    }




    @Test
    void testGetBrandById_Found() {
        // Chuẩn bị dữ liệu
        BrandDTO dto = new BrandDTO();
        dto.setId(1);
        dto.setBrandName("Nike");
        dto.setBrandInfo("Info");
        dto.setLogoPublicId("logo123");
        dto.setProductIds(Set.of(3, 4));

        when(brandService.getBrandById(1)).thenReturn(dto);

        // Gọi controller
        ResponseEntity<?> response = brandController.getBrandById(1);

        assertThat(response.getStatusCodeValue()).isEqualTo(200);

        // Kiểm tra kiểu dữ liệu trả về
        Object body = response.getBody();
        assertThat(body).isInstanceOf(ApiResponse.class);

        ApiResponse<?> apiResponse = (ApiResponse<?>) body;
        Object data = apiResponse.getData();

        // Kiểm tra dữ liệu là BrandDTO
        assertThat(data).isInstanceOf(BrandDTO.class);

        BrandDTO result = (BrandDTO) data;

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getBrandName()).isEqualTo("Nike");
        assertThat(result.getBrandInfo()).isEqualTo("Info");
        assertThat(result.getLogoPublicId()).isEqualTo("logo123");
        assertThat(result.getProductIds()).containsExactlyInAnyOrder(3, 4);
    }

    @Test
    void testGetBrandById_NotFound() {
        // Giả lập không tìm thấy
        when(brandService.getBrandById(1)).thenReturn(null);

        // Gọi controller
        ResponseEntity<?> response = brandController.getBrandById(1);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);


        Object body = response.getBody();
        assertThat(body).isInstanceOf(ApiResponse.class);

        ApiResponse<?> apiResponse = (ApiResponse<?>) body;

        assertThat(apiResponse.getMessage()).contains("Brand không tồn tại");
        assertThat(apiResponse.getStatus()).isEqualTo(404);
        assertThat(apiResponse.getData()).isNull();
    }

    @Test
    void testAddBrand() {
        // Chuẩn bị dữ liệu đầu vào và kết quả mong muốn
        BrandCreateDto createDto = new BrandCreateDto("Nike", "Info", "logo123");

        BrandDTO dto = new BrandDTO();
        dto.setId(1);
        dto.setBrandName("Nike");
        dto.setBrandInfo("Info");
        dto.setLogoPublicId("logo123");
        dto.setProductIds(Set.of());

        when(brandService.addBrand(any(BrandCreateDto.class))).thenReturn(dto);

        // Gọi controller
        ResponseEntity<?> response = brandController.addBrand(createDto);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        Object body = response.getBody();
        assertThat(body).isInstanceOf(ApiResponse.class);

        ApiResponse<?> apiResponse = (ApiResponse<?>) body;

        assertThat(apiResponse.getMessage()).contains("thêm mới");
        assertThat(apiResponse.getStatus()).isEqualTo(200);
        assertThat(apiResponse.getData()).isInstanceOf(BrandDTO.class);

        BrandDTO result = (BrandDTO) apiResponse.getData();
        assertThat(result.getBrandName()).isEqualTo("Nike");
        assertThat(result.getBrandInfo()).isEqualTo("Info");
        assertThat(result.getLogoPublicId()).isEqualTo("logo123");
    }

    @Test
    void testUpdateBrand() {
        // Chuẩn bị dữ liệu cập nhật và kết quả mong muốn
        BrandUpdateDto updateDto = new BrandUpdateDto(1, "Adidas", "logo456", "Mô tả mới");

        BrandDTO updatedDto = new BrandDTO();
        updatedDto.setId(1);
        updatedDto.setBrandName("Adidas");
        updatedDto.setBrandInfo("Mô tả mới");
        updatedDto.setLogoPublicId("logo456");
        updatedDto.setProductIds(Set.of());

        when(brandService.updateBrand(eq(1), any(BrandUpdateDto.class))).thenReturn(updatedDto);

        // Gọi controller
        ResponseEntity<?> response = brandController.updateBrand(1, updateDto);

        assertThat(response.getStatusCodeValue()).isEqualTo(200);


        Object body = response.getBody();
        assertThat(body).isInstanceOf(ApiResponse.class);

        ApiResponse<?> apiResponse = (ApiResponse<?>) body;

        assertThat(apiResponse.getStatus()).isEqualTo(200);
        assertThat(apiResponse.getData()).isInstanceOf(BrandDTO.class);

        BrandDTO result = (BrandDTO) apiResponse.getData();
        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getBrandName()).isEqualTo("Adidas");
        assertThat(result.getBrandInfo()).isEqualTo("Mô tả mới");
        assertThat(result.getLogoPublicId()).isEqualTo("logo456");
    }



    @Test
    void testDeleteBrand_Success() {
        when(brandService.deleteBrand(1)).thenReturn(true);

        ResponseEntity<?> response = brandController.deleteBrand(1);

        assertThat(response.getStatusCodeValue()).isEqualTo(200);

        ApiResponse<?> body = (ApiResponse<?>) response.getBody();

        // Message mặc định là "Success"
        assertThat(body.getMessage()).isEqualTo("Success");

        // Data là chuỗi bạn truyền vào trong success()
        assertThat(body.getData()).isEqualTo("Brand đã được xóa thành công");
    }

    @Test
    void testDeleteBrand_Failure() {
        when(brandService.deleteBrand(1)).thenReturn(false);

        ResponseEntity<?> response = brandController.deleteBrand(1);

        assertThat(response.getStatusCodeValue()).isEqualTo(400);

        ApiResponse<?> body = (ApiResponse<?>) response.getBody();

        assertThat(body.getMessage()).isEqualTo("Xóa Brand thất bại");

        // Nếu ApiResponse có getError() bạn kiểm tra ở đây:
        // assertThat(body.getError()).isEqualTo("Brand không tồn tại hoặc đã bị xóa rồi");

        // Nếu không có getError(), kiểm tra data null hoặc bỏ dòng kiểm tra data
        assertThat(body.getData()).isNull();
    }

}