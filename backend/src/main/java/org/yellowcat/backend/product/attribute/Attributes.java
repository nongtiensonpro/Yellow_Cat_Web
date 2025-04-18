package org.yellowcat.backend.product.attribute;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;


@Entity
@Table(name = "attributes")
public class Attributes {
    @Id
    @ColumnDefault("nextval('attributes_attribute_id_seq')")
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

    public Attributes() {
    }

    public Attributes(Integer id, String attributeName, String dataType) {
        this.id = id;
        this.attributeName = attributeName;
        this.dataType = dataType;
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