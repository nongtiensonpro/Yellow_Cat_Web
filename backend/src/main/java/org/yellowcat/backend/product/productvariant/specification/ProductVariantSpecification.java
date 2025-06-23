package org.yellowcat.backend.product.productvariant.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.brand.Brand;
import org.yellowcat.backend.product.category.Category;
import org.yellowcat.backend.product.color.Color;
import org.yellowcat.backend.product.material.Material;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.size.Size;
import org.yellowcat.backend.product.targetaudience.TargetAudience;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProductVariantSpecification {
    public static Specification<ProductVariant> filter(
            String name,
            Long categoryId,
            Long brandId,
            Long materialId,
            Long targetAudienceId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Long colorId,
            Long sizeId
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            Join<ProductVariant, Product> product = root.join("product", JoinType.INNER);
            Join<Product, Category> category = product.join("category", JoinType.LEFT);
            Join<Product, Brand> brand = product.join("brand", JoinType.LEFT);
            Join<Product, Material> material = product.join("material", JoinType.LEFT);
            Join<Product, TargetAudience> audience = product.join("targetAudience", JoinType.LEFT);
            Join<ProductVariant, Color> color = root.join("color", JoinType.LEFT);
            Join<ProductVariant, Size> size = root.join("size", JoinType.LEFT);

            // Chỉ lấy sản phẩm active
            predicates.add(cb.isTrue(product.get("isActive")));

            if (name != null && !name.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(product.get("productName")),
                        "%" + name.toLowerCase() + "%"
                ));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(category.get("id"), categoryId));
            }
            if (brandId != null) {
                predicates.add(cb.equal(brand.get("id"), brandId));
            }
            if (materialId != null) {
                predicates.add(cb.equal(material.get("id"), materialId));
            }
            if (targetAudienceId != null) {
                predicates.add(cb.equal(audience.get("id"), targetAudienceId));
            }
            if (minPrice != null) {
                predicates.add(cb.ge(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.le(root.get("price"), maxPrice));
            }
            if (colorId != null) {
                predicates.add(cb.equal(color.get("id"), colorId));
            }
            if (sizeId != null) {
                predicates.add(cb.equal(size.get("id"), sizeId));
            }

            query.distinct(true);
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
