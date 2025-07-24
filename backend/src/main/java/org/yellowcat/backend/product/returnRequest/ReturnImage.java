package org.yellowcat.backend.product.returnRequest;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "return_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "return_image_id")
    private Integer returnImageId;

    @ManyToOne
    @JoinColumn(name = "return_item_id")
    private ReturnItem returnItem;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt = LocalDateTime.now();

    private String description;
}
