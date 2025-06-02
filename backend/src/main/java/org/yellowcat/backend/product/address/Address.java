package org.yellowcat.backend.product.address;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.yellowcat.backend.product.userApp.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "Addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_id")
    private Integer addressId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_user_id", nullable = false)
    private User user;

    @Column(name = "recipient_name", nullable = false)
    private String recipientName;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(name = "street_address", nullable = false)
    private String streetAddress;

    @Column(name = "ward_commune", nullable = false)
    private String wardCommune;

    @Column(nullable = false)
    private String district;

    @Column(name = "city_province", nullable = false)
    private String cityProvince;

    @Column(columnDefinition = "VARCHAR(100) DEFAULT 'Việt Nam'")
    private String country;

    @Column(name = "is_default", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isDefault;

    @Column(name = "address_type")
    private String addressType;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (country == null) {
            country = "Việt Nam";
        }
        if (isDefault == null) {
            isDefault = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}