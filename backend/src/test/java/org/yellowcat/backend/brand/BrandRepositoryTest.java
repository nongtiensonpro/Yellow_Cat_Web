package org.yellowcat.backend.brand;


import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.brand.Brand;
import org.yellowcat.backend.product.brand.BrandRepository;

@DataJpaTest
public class BrandRepositoryTest {

    @Autowired
    private BrandRepository brandRepository;

    @Test
    void testFindAllWithProducts() {
        try {
            // Tạo brand mẫu
            Brand brand = new Brand();
            brand.setBrandName("Brand Test");
            brand.setBrandInfo("Info Test");
            brand.setLogoPublicId("logo123");

            // Tạo sản phẩm mẫu, gán brand cho product
            Product product1 = new Product();
            product1.setProductName("Test Product 1");
            product1.setBrand(brand);

            Product product2 = new Product();
            product2.setProductName("Test Product 2");
            product2.setBrand(brand);

            // Thiết lập quan hệ 2 chiều nếu có (Brand có setProducts)
            brand.setProducts(Set.of(product1, product2));

            // Lưu brand, cascade sẽ lưu products nếu cascade cấu hình đúng
            brandRepository.save(brand);

            // Thực hiện truy vấn kèm page
            Page<Brand> brandsPage = brandRepository.findAllWithProducts(PageRequest.of(0, 10));

            assertThat(brandsPage).isNotEmpty();

            Brand fetchedBrand = brandsPage.getContent().stream()
                    .filter(b -> "Brand Test".equals(b.getBrandName()))
                    .findFirst()
                    .orElseThrow(() -> new AssertionError("Brand Test không tồn tại trong kết quả"));

            assertThat(fetchedBrand.getBrandName()).isEqualTo("Brand Test");
            assertThat(fetchedBrand.getProducts()).hasSize(2);
            assertThat(fetchedBrand.getProducts())
                    .extracting(Product::getProductName)
                    .containsExactlyInAnyOrder("Test Product 1", "Test Product 2");

            System.out.println(">>> Test FindAllWithProducts thực hiện thành công!");
        } catch (AssertionError e) {
            System.err.println(">>> Test FindAllWithProducts không thành công: " + e.getMessage());
            throw e; // ném tiếp để test fail đúng chuẩn
        }
    }
}
