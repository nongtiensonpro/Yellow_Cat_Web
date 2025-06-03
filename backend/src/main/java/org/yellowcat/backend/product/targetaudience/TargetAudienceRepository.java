package org.yellowcat.backend.product.targetaudience;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TargetAudienceRepository extends JpaRepository<TargetAudience, Integer> {
}
