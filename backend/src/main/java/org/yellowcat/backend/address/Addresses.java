package org.yellowcat.backend.address;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.yellowcat.backend.user.AppUser;

import java.time.Instant;


@Getter
@Setter
@Entity
@Table(name = "addresses")
public class Addresses {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_id")
    private Integer addressId;

    @ManyToOne()
    @JoinColumn(name = "app_user_id", nullable = false)
    private AppUser appUser;

    @NotNull
    @Size(max = 255)
    @Column(name = "recipient_name", nullable = false)
    private String recipientName;

    @NotNull
    @Size(max = 20)
    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @NotNull
    @Size(max = 255)
    @Column(name = "street_address", nullable = false)
    private String streetAddress;

    @NotNull
    @Size(max = 100)
    @Column(name = "ward_commune", nullable = false)
    private String wardCommune;

    @NotNull
    @Size(max = 100)
    @Column(name = "district", nullable = false)
    private String district;

    @NotNull
    @Size(max = 100)
    @Column(name = "city_province", nullable = false)
    private String cityProvince;

    @Size(max = 100)
    @Column(name = "country")
    private String country; // Không có giá trị mặc định trong Java

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Size(max = 50)
    @Column(name = "address_type")
    private String addressType;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.isDefault == null) {
            this.isDefault = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
