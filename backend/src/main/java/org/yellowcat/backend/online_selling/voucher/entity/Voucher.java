package org.yellowcat.backend.online_selling.voucher.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.yellowcat.backend.online_selling.voucher.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "OnlineVoucher")
@Table(name = "voucher1")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Voucher {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Integer id;

        @Column(nullable = false, unique = true)
        private String code;

        @Column
        private String name;

        @Column
        private String description;

        @Enumerated(EnumType.STRING)
        @Column(name = "discount_type", nullable = false)
        private DiscountType discountType;

        @Column(name = "discount_value")
        private BigDecimal discountValue;

        @Column(name = "start_date", nullable = false)
        private LocalDateTime startDate;

        @Column(name = "end_date", nullable = false)
        private LocalDateTime endDate;

        @Column(name = "max_usage", nullable = false)
        private Integer maxUsage;

        @Column(name = "usage_count", nullable = false)
        private Integer usageCount = 0;

        @Column(name = "min_order_value")
        private BigDecimal minOrderValue = BigDecimal.ZERO;

        @Column(name = "max_discount_amount")
        private BigDecimal maxDiscountAmount;

        @Column(name = "is_active")
        private Boolean isActive = true;

        @Column(name = "created_at", updatable = false)
        private LocalDateTime createdAt;

        @OneToMany(mappedBy = "voucher", cascade = CascadeType.ALL, orphanRemoval = true)
        private List<VoucherScope> scopes = new ArrayList<>();

        @Column(name = "update_at")
        private LocalDateTime updatedAt;

        }

