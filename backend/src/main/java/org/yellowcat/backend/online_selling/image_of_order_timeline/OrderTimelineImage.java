package org.yellowcat.backend.online_selling.image_of_order_timeline;

import jakarta.persistence.*;
import lombok.Data;
import org.yellowcat.backend.online_selling.orderTimeline.OrderTimeline;

@Entity
@Table(name = "order_timeline_images")
@Data
public class OrderTimelineImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timeline_id")
    private OrderTimeline orderTimeline;

    private String imageUrl;
}
