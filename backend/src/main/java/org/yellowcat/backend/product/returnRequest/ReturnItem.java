package org.yellowcat.backend.product.returnRequest;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.product.orderItem.OrderItem;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "return_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "return_item_id")
    private Integer returnItemId;

    @ManyToOne
    @JoinColumn(name = "return_request_id", nullable = false)
    private ReturnRequest returnRequest;

    @ManyToOne
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column(name = "quantity_returned")
    private Integer quantityReturned;

    @Column(name = "refund_amount")
    private BigDecimal refundAmount;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @OneToMany(mappedBy = "returnItem", cascade = CascadeType.ALL)
    private List<ReturnImage> images;
}

