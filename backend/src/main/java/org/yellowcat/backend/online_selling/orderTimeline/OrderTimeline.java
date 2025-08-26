package org.yellowcat.backend.online_selling.orderTimeline;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;


@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Entity
@Table(name = "order_timelines")
public class OrderTimeline {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "from_status")
    private String fromStatus;

    @Column(name = "to_status")
    private String toStatus;

    @Column(name = "note")
    private String note;

    @Column(name = "changed_at")
    private LocalDateTime changedAt;

    @Column(name = "updated_by")
    private Integer updatedBy;

    public OrderTimeline(Integer orderId, String fromStatus, String toStatus, String note, LocalDateTime changedAt, Integer updatedBy) {
        this.orderId = orderId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.note = note;
        this.changedAt = changedAt;
        this.updatedBy = updatedBy;
    }

}
