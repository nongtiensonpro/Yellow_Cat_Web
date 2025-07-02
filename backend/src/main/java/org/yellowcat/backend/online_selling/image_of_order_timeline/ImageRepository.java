package org.yellowcat.backend.online_selling.image_of_order_timeline;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.awt.*;

@Repository
public interface ImageRepository extends JpaRepository<OrderTimelineImage, Integer> {
}
