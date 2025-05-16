package org.yellowcat.backend.product.attribute;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.yellowcat.backend.product.attributevalue.AttributeValue;

import java.util.List;


@Entity
@Table(name = "attributes")
public class Attributes {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attribute_id", nullable = false)
    private Integer id;

    @Size(max = 255)
    @NotNull
    @Column(name = "attribute_name", nullable = false)
    private String attributeName;

    @Size(max = 50)
    @NotNull
    @Column(name = "data_type", nullable = false, length = 50)
    private String dataType;

    @OneToMany(mappedBy = "attribute")
    private List<AttributeValue> values;

    public Attributes() {
    }

    public Attributes(Integer id, String attributeName, String dataType) {
        this.id = id;
        this.attributeName = attributeName;
        this.dataType = dataType;
    }

    public Attributes(Integer id, String attributeName, String dataType, List<AttributeValue> values) {
        this.id = id;
        this.attributeName = attributeName;
        this.dataType = dataType;
        this.values = values;
    }

    public List<AttributeValue> getValues() {
        return values;
    }

    public void setValues(List<AttributeValue> values) {
        this.values = values;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getAttributeName() {
        return attributeName;
    }

    public void setAttributeName(String attributeName) {
        this.attributeName = attributeName;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }
}