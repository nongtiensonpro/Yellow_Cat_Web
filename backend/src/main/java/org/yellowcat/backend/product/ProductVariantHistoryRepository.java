package org.yellowcat.backend.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductVariantHistoryRepository extends JpaRepository<ProductVariantsHistory, Integer> {
    List<ProductVariantsHistory> findByHistoryGroupId(UUID historyGroupId);

    @EntityGraph(attributePaths = "changedBy")
    Page<ProductVariantsHistory> findAllByHistoryGroupId(UUID historyGroupId, Pageable pageable);
}
