package org.yellowcat.backend.online_selling.orderTimeline;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderTimelineRepository extends JpaRepository<OrderTimeline, Integer> {

     List<OrderTimeline> findByOrderIdOrderByChangedAtAsc(Integer orderId);

     Optional<OrderTimeline> findFirstByOrderIdAndToStatusOrderByChangedAtAsc(Integer orderId, String toStatus);

     List<OrderTimeline> findByToStatusAndChangedAtBefore(String toStatus, LocalDateTime changedAtBefore);

}
