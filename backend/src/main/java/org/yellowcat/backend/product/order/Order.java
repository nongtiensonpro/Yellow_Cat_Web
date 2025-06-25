package org.yellowcat.backend.product.order;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.address.Addresses;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.payment.Payment;
import org.yellowcat.backend.product.shipment.Shipment;
import org.yellowcat.backend.product.shippingMethod.ShippingMethod;
import org.yellowcat.backend.user.AppUser;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "Orders") // Tên bảng vẫn là "Orders"
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order { // Tên class là Order (số ít)

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "order_code", unique = true)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_user_id") // Allow NULL as per ON DELETE SET NULL
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipping_address_id")
    private Addresses shippingAddress;

    @Column(name = "order_date", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime orderDate;

    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "sub_total_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal subTotalAmount;

    @Column(name = "shipping_fee", precision = 10, scale = 2, columnDefinition = "NUMERIC(10,2) DEFAULT 0")
    private BigDecimal shippingFee;

    @Column(name = "discount_amount", precision = 12, scale = 2, columnDefinition = "NUMERIC(12,2) DEFAULT 0")
    private BigDecimal discountAmount;

    @Column(name = "final_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal finalAmount;

    @Column(name = "order_status", nullable = false, columnDefinition = "VARCHAR(50) DEFAULT 'Pending'")
    private String orderStatus;

    @Column(name = "code_order_in_ghtk", unique = true)
    private String codeOrderInGHK;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipping_method_id")
    private ShippingMethod shippingMethod;

    @Lob // Hoặc @Column(columnDefinition = "TEXT")
    @Column(name = "customer_notes")
    private String customerNotes;

    @Column(name = "is_synced_to_ghtk", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isSyncedToGhtk;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Shipment shipment;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Payment> payments;

    @PrePersist
    protected void onCreate() {
        orderDate = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (shippingFee == null) shippingFee = BigDecimal.ZERO;
        if (discountAmount == null) discountAmount = BigDecimal.ZERO;
        if (orderStatus == null) orderStatus = "Pending";
        if (isSyncedToGhtk == null) isSyncedToGhtk = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}