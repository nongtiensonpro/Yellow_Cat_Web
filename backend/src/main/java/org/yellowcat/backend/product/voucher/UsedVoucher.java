package org.yellowcat.backend.product.voucher;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.user.AppUser;

import java.time.LocalDateTime;


@Entity
@Table(name = "used_vouchers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsedVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "used_voucher_id")
    private Integer usedVoucherId;

    @ManyToOne
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;

    @ManyToOne
    @JoinColumn(name = "app_user_id", nullable = false)
    private AppUser appUser;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Builder.Default
    private Integer quantityUsed = 0;

    @Column(name = "used_at", nullable = false)
    private LocalDateTime usedAt;

    @PrePersist
    private void prePersist() {
        if (usedAt == null) {
            usedAt = LocalDateTime.now();
        }
    }
}
