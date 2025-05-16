package org.yellowcat.backend.product.attributevalue;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.yellowcat.backend.product.attribute.Attributes;

@Entity
@Table(name = "attribute_values")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttributeValue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attribute_value_id")
    private Integer attributeValueId;

    @ManyToOne
    @JoinColumn(name = "attribute_id")
    private Attributes attribute;

    private String value;
}
