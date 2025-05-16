package org.yellowcat.backend.product.variant;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.yellowcat.backend.product.attributevalue.AttributeValue;
import org.yellowcat.backend.product.productvariant.ProductVariant;

@Entity
@Table(name = "variant_attributes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VariantAttribute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer variantAttributeId;

    @ManyToOne
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @ManyToOne
    @JoinColumn(name = "attribute_value_id")
    private AttributeValue attributeValue;
}