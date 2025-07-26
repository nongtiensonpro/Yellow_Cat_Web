package org.yellowcat.backend.product.returnRequest;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.user.AppUser;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "return_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "return_request_id")
    private Integer returnRequestId;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne
    @JoinColumn(name = "app_user_id", nullable = false)
    private AppUser appUser;

    @Column(name = "request_date")
    private LocalDateTime requestDate = LocalDateTime.now();

    @Column(columnDefinition = "TEXT", name = "return_reason")
    private String returnReason;

    //Yêu cầu đang chờ xét duyệt: PENDING
    //Yêu cầu đã được chấp nhận, chờ khách gửi hàng: APPROVED
    //Kho đã nhận được hàng trả về, đang kiểm tra: RECEIVED
    //Yêu cầu bị từ chối: REJECTED
    //Yêu cầu đã hoàn tất, đã hoàn tiền/đổi hàng và cập nhật tồn kho: COMPLETED
    private String status = "Pending";

    @Column(name = "refund_amount")
    private BigDecimal refundAmount;

    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    @Column(columnDefinition = "TEXT")
    private String note;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "returnRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReturnItem> items;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.requestDate = LocalDateTime.now();
        this.status = "PENDING";
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void calculateTotalRefundAmount() {
        this.refundAmount = this.items.stream()
                .map(ReturnItem::getRefundAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
