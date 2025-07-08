package org.yellowcat.backend.online_selling.productwaitlist;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.user.AppUser;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_waitlist_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductWaitlistRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(nullable = false)
    private String email;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WaitlistStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_user_id")
    private AppUser appUser;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductWaitlistItem> items = new ArrayList<>();
}
