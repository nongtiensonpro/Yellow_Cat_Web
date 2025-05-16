package org.yellowcat.backend.product.productattribute;

import jakarta.persistence.*;
import lombok.Data;
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.attributevalue.AttributeValue;

@Data
@Entity
@Table(name = "Product_Attributes")
public class ProductAttribute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_attribute_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "attribute_value_id")
    private AttributeValue attributeValue;
}