package org.yellowcat.backend.product.shippingMethod;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "ShippingMethods")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShippingMethod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shipping_method_id")
    private Integer shippingMethodId;

    @Column(name = "method_name", nullable = false)
    private String methodName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal baseCost;

    @Column(name = "is_active", columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive;

    @PrePersist
    protected void onCreate() {
        if (isActive == null) {
            isActive = true;
        }
    }
}